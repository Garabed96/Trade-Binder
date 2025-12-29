import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import bcrypt from 'bcryptjs';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;
    return await pool.maybeOne(sql.type(
      z.object({
        id: z.string(),
        username: z.string(),
        email: z.string(),
        registration_complete: z.boolean(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        location_name: z.string().nullable(),
        bio: z.string().nullable(),
      }),
    )`
      SELECT id, username, email, registration_complete, latitude, longitude, location_name, bio
      FROM users
      WHERE id = ${userId}
    `);
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        location_name: z.string().nullable(),
        bio: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session.user as { id: string }).id;
      return await pool.one(sql.type(z.object({ id: z.string() }))`
        UPDATE users
        SET 
          username = ${input.username},
          latitude = ${input.latitude},
          longitude = ${input.longitude},
          location_name = ${input.location_name},
          bio = ${input.bio},
          registration_complete = TRUE
        WHERE id = ${userId}
        RETURNING id
      `);
    }),

  list: publicProcedure.query(async () => {
    return await pool.any(sql.type(
      z.object({
        id: z.string(),
        username: z.string(),
      }),
    )`
      SELECT id, username
      FROM users
    `);
  }),

  create: publicProcedure
    .input(
      z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      return await pool.one(sql.type(z.object({ id: z.string() }))`
        INSERT INTO users (username, email, password_hash)
        VALUES (${input.username}, ${input.email}, ${passwordHash}) RETURNING id`);
    }),
});
