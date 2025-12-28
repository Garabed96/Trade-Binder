import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import bcrypt from 'bcryptjs';

export const userRouter = router({
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
