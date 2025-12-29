import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pool, sql } from '../server/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email' } },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await pool.maybeOne(sql.type(
          z.object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
            password_hash: z.string().nullable(),
            registration_complete: z.boolean(),
          }),
        )`
          SELECT id, email, username, password_hash, registration_complete
          FROM users
          WHERE email = ${credentials.email}
        `);

        if (!user || !user.password_hash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          registration_complete: user.registration_complete,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn Callback:', { provider: account?.provider, email: user.email });

      if (account?.provider === 'credentials') return true;

      // Handle OAuth users: persistence to DB
      if (user.email) {
        try {
          const existingUser = await pool.maybeOne(sql.type(z.object({ id: z.string() }))`
            SELECT id FROM users WHERE email = ${user.email}
          `);

          if (!existingUser) {
            console.log('Creating new OAuth user:', user.email);
            await pool.one(sql.type(z.object({ id: z.string() }))`
              INSERT INTO users (username, email)
              VALUES (${user.name || user.email.split('@')[0]}, ${user.email})
              RETURNING id
            `);
          } else {
            console.log('Existing OAuth user found:', existingUser.id);
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false; // Fail sign-in if DB error
        }
      } else {
        console.error('No email provided by OAuth provider');
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        console.log('JWT Initial Sign-in:', { email: user.email });
        try {
          // Fetch the DB user ID and registration_complete status for this email
          const dbUser = await pool.maybeOne(sql.type(
            z.object({ id: z.string(), registration_complete: z.boolean() }),
          )`
            SELECT id, registration_complete FROM users WHERE email = ${user.email}
          `);
          if (dbUser) {
            console.log(
              'Mapping DB ID and registration status to JWT:',
              dbUser.id,
              dbUser.registration_complete,
            );
            token.sub = dbUser.id;
            token.registration_complete = dbUser.registration_complete;
          } else {
            console.warn('DB user not found during JWT generation for:', user.email);
          }
        } catch (error) {
          console.error('Error in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback:', { tokenSub: token.sub });
      if (session.user && token.sub) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        session.user.id = token.sub;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        session.user.registration_complete = token.registration_complete;
      }
      return session;
    },
  },
};
