import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const marketplaceRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        countryCode: z.string().optional(),
        type: z.enum(['trade', 'sale']).optional(),
        page: z.number().default(1),
      }),
    )
    .query(async ({ input }) => {
      const limit = 40;
      const offset = (input.page - 1) * limit;

      const filters = [sql.fragment`b.is_public = TRUE`, sql.fragment`b.type IN ('trade', 'sale')`];

      if (input.query) {
        filters.push(sql.fragment`d.name ILIKE ${'%' + input.query + '%'}`);
      }

      if (input.countryCode) {
        filters.push(sql.fragment`u.country_code = ${input.countryCode}`);
      }

      if (input.type) {
        filters.push(sql.fragment`b.type = ${input.type}`);
      }

      const whereClause = sql.fragment`WHERE ${sql.join(filters, sql.fragment` AND `)}`;

      const countResult = await pool.one(sql.type(z.object({ total: z.number() }))`
        SELECT COUNT(*)::int as total
        FROM user_cards uc
        JOIN binders b ON uc.binder_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        ${whereClause}
      `);

      const results = await pool.any(sql.type(
        z.object({
          user_card_id: z.string(),
          printing_id: z.string(),
          name: z.string(),
          image_uri_normal: z.string().nullable(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          price_usd: z.number().nullable(),
          seller_id: z.string(),
          seller_username: z.string(),
          seller_country_code: z.string().nullable(),
          binder_id: z.string(),
          binder_name: z.string(),
          binder_type: z.string(),
        }),
      )`
        SELECT 
          uc.id as user_card_id, uc.printing_id, d.name, p.image_uri_normal, 
          uc.condition, uc.is_foil, uc.language, p.price_usd,
          u.id as seller_id, u.username as seller_username, u.country_code as seller_country_code,
          b.id as binder_id, b.name as binder_name, b.type as binder_type
        FROM user_cards uc
        JOIN binders b ON uc.binder_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        ${whereClause}
        ORDER BY uc.acquired_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      return {
        listings: results,
        totalCount: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      };
    }),

  getCardListings: publicProcedure
    .input(
      z.object({
        printingId: z.string().uuid(),
        countryCode: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const filters = [
        sql.fragment`uc.printing_id = ${input.printingId}`,
        sql.fragment`b.is_public = TRUE`,
        sql.fragment`b.type IN ('trade', 'sale')`,
      ];

      if (input.countryCode) {
        filters.push(sql.fragment`u.country_code = ${input.countryCode}`);
      }

      const whereClause = sql.fragment`WHERE ${sql.join(filters, sql.fragment` AND `)}`;

      return await pool.any(sql.type(
        z.object({
          user_card_id: z.string(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          price_usd: z.number().nullable(),
          seller_id: z.string(),
          seller_username: z.string(),
          seller_country_code: z.string().nullable(),
          binder_id: z.string(),
          binder_name: z.string(),
          binder_type: z.string(),
        }),
      )`
        SELECT 
          uc.id as user_card_id, uc.condition, uc.is_foil, uc.language, p.price_usd,
          u.id as seller_id, u.username as seller_username, u.country_code as seller_country_code,
          b.id as binder_id, b.name as binder_name, b.type as binder_type
        FROM user_cards uc
        JOIN binders b ON uc.binder_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN card_printings p ON uc.printing_id = p.id
        ${whereClause}
        ORDER BY p.price_usd ASC NULLS LAST
      `);
    }),
});
