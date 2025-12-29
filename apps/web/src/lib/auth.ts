import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pool, sql } from '../server/db';
import bcrypt from 'bcryptjs';

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

        /*
        const user = (await pool.maybeOne(sql.typeAlias('user')`
          SELECT id, email, username, password_hash
          FROM users
          WHERE email = ${credentials.email}
        `)) as { id: string; email: string; username: string; password_hash: string } | null;

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
        };
        */
        return null;
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
    async signIn({ user, account, profile }) {
      console.log('SignIn Callback:', { provider: account?.provider, email: user.email });
      return true;
      /*
      if (account?.provider === 'credentials') return true;

      // Handle OAuth users: persistence to DB
      if (user.email) {
        try {
          const existingUser = await pool.maybeOne(sql.typeAlias('user')`
            SELECT id FROM users WHERE email = ${user.email}
          `);

          if (!existingUser) {
            console.log('Creating new OAuth user:', user.email);
            await pool.query(sql.typeAlias('user')`
              INSERT INTO users (username, email)
              VALUES (${user.name || user.email.split('@')[0]}, ${user.email})
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
      */
    },
    async jwt({ token, user, account }) {
      /*
      if (user) {
        console.log('JWT Initial Sign-in:', { email: user.email });
        try {
          // Fetch the DB user ID for this email
          const dbUser = await pool.maybeOne(sql.typeAlias('user')`
            SELECT id FROM users WHERE email = ${user?.email}
          `);
          if (dbUser) {
            console.log('Mapping DB ID to JWT:', dbUser.id);
            token.sub = dbUser?.id;
          } else {
            console.warn('DB user not found during JWT generation for:', user.email);
          }
        } catch (error) {
          console.error('Error in jwt callback:', error);
        }
      }
      */
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback:', { tokenSub: token.sub });
      if (session.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
