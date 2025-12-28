import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

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
    .input(z.object({ username: z.string(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      return await pool.one(sql.type(z.object({ id: z.string() }))`
        INSERT INTO users (username, email)
        VALUES (${input.username}, ${input.email}) RETURNING id`);
    }),
});
