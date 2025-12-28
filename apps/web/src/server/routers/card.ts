import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const cardRouter = router({
  listSets: publicProcedure.query(async () => {
    return await pool.any(sql.type(
      z.object({
        code: z.string(),
        name: z.string(),
      }),
    )`
      SELECT code, name FROM card_sets ORDER BY name ASC
    `);
  }),

  getLatestSet: publicProcedure.query(async () => {
    return await pool.maybeOne(sql.type(
      z.object({
        code: z.string(),
        name: z.string(),
        released_at: z.string().nullable(),
      }),
    )`
      SELECT code, name, released_at::text 
      FROM card_sets 
      WHERE released_at <= NOW()
      ORDER BY released_at DESC 
      LIMIT 1
    `);
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        rarity: z.string().optional(),
        set_code: z.string().optional(),
        colors: z.array(z.string()).optional(),
        orderBy: z.enum(['name', 'price_usd', 'released_at']).default('name'),
        orderDir: z.enum(['ASC', 'DESC']).default('ASC'),
        page: z.number().default(1),
      }),
    )
    .query(async ({ input }) => {
      const limit = 40;
      const offset = (input.page - 1) * limit;

      const filters = []; // Start with an empty array

      if (input.query && input.query.trim().length >= 1) {
        filters.push(sql.fragment`d.name ILIKE ${'%' + input.query + '%'}`);
      }

      if (input.rarity) {
        filters.push(sql.fragment`p.rarity = ${input.rarity}`);
      }

      if (input.set_code) {
        filters.push(sql.fragment`p.set_code = ${input.set_code.toLowerCase()}`);
      }

      // Color filtering via the intersection table
      if (input.colors && input.colors.length > 0) {
        filters.push(sql.fragment`EXISTS (
          SELECT 1 FROM card_design_colors cdc 
          WHERE cdc.design_id = d.oracle_id 
          AND cdc.color_id = ANY(${sql.array(input.colors, 'text')})
        )`);
      }

      const whereClause =
        filters.length > 0
          ? sql.fragment`WHERE ${sql.join(filters, sql.fragment` AND `)}`
          : sql.fragment``;

      const sortColumn =
        input.orderBy === 'name'
          ? sql.identifier(['d', 'name'])
          : sql.identifier(['p', input.orderBy]);
      const sortDir = input.orderDir === 'ASC' ? sql.fragment`ASC` : sql.fragment`DESC`;

      // 1. Fetch total count for pagination info
      const countResult = await pool.one(sql.type(z.object({ total: z.number() }))`
        SELECT COUNT(*)::int as total
        FROM card_designs d
               JOIN card_printings p ON d.oracle_id = p.design_id
          ${whereClause}
      `);

      // 2. Fetch the specific page of cards
      const results = await pool.any(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          image_uri_normal: z.string().nullable(),
          price_usd: z.number().nullable(),
        }),
      )`
        SELECT
          p.id, d.name, s.name as set_name, p.set_code,
          p.rarity, p.image_uri_normal, p.price_usd
        FROM card_designs d
               JOIN card_printings p ON d.oracle_id = p.design_id
               JOIN card_sets s ON p.set_code = s.code
          ${whereClause}
        ORDER BY ${sortColumn} ${sortDir}
          LIMIT ${limit}
        OFFSET ${offset}
      `);

      return {
        cards: results,
        totalCount: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      };
    }),

  fuzzySearch: publicProcedure
    .input(z.object({ query: z.string().min(3) }))
    .query(async ({ input }) => {
      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          image_uri_small: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          price_usd: z.number().nullable(),
        }),
      )`
        SELECT 
          p.id, d.name, p.image_uri_small, s.name as set_name, p.set_code, p.price_usd
        FROM card_designs d
        JOIN card_printings p ON d.oracle_id = p.design_id
        JOIN card_sets s ON p.set_code = s.code
        WHERE d.name ILIKE ${'%' + input.query + '%'}
        ORDER BY d.name ASC
        LIMIT 5
      `);
    }),
});
