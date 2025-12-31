import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const profileRouter = router({
  get: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    return await pool.maybeOne(sql.type(
      z.object({
        id: z.string(),
        username: z.string(),
        bio: z.string().nullable(),
        location_name: z.string().nullable(),
        country_code: z.string().nullable(),
        created_at: z.string(),
      }),
    )`
        SELECT id, username, bio, location_name, country_code, created_at::text
        FROM users
        WHERE username = ${input.username}
      `);
  }),

  getPublicBinders: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          type: z.string(),
          card_count: z.number(),
        }),
      )`
        SELECT b.id, b.name, b.description, b.type, COUNT(uc.id)::int as card_count
        FROM binders b
        LEFT JOIN user_cards uc ON b.id = uc.binder_id
        WHERE b.user_id = ${input.userId} AND b.is_public = TRUE
        GROUP BY b.id
        ORDER BY b.name ASC
      `);
    }),

  stats: publicProcedure.input(z.object({ userId: z.string().uuid() })).query(async ({ input }) => {
    return await pool.one(sql.type(
      z.object({
        total_cards: z.number(),
        public_binders_count: z.number(),
        trade_cards_count: z.number(),
      }),
    )`
        SELECT 
          (SELECT COUNT(*)::int FROM user_cards WHERE user_id = ${input.userId}) as total_cards,
          (SELECT COUNT(*)::int FROM binders WHERE user_id = ${input.userId} AND is_public = TRUE) as public_binders_count,
          (SELECT COUNT(uc.id)::int 
           FROM user_cards uc 
           JOIN binders b ON uc.binder_id = b.id 
           WHERE uc.user_id = ${input.userId} AND b.type = 'trade') as trade_cards_count
      `);
  }),
});
