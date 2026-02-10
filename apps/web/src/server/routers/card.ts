import { z } from 'zod';
import { router, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const cardRouter = router({
  listSets: publicProcedure.query(async () => {
    return await pool.any(sql.type(
      z.object({
        code: z.string(),
        name: z.string(),
      })
    )`
      SELECT code, name
      FROM card_sets
      ORDER BY name ASC
    `);
  }),

  getLatestSet: publicProcedure.query(async () => {
    return await pool.maybeOne(sql.type(
      z.object({
        code: z.string(),
        name: z.string(),
        released_at: z.string().nullable(),
      })
    )`
      SELECT code, name, released_at::text
      FROM card_sets
      WHERE released_at <= NOW()
      ORDER BY released_at DESC LIMIT 1
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
      })
    )
    .query(async ({ input }) => {
      const limit = 40;
      const offset = (input.page - 1) * limit;

      const filters = []; // Start with an empty array

      if (input.query && input.query.trim().length >= 1) {
        filters.push(sql.fragment`d.name ILIKE ${'%' + input.query + '%'}`);
      }

      // For rarity/set filters, we filter on printings but still group by design
      if (input.rarity) {
        filters.push(sql.fragment`p.rarity = ${input.rarity}`);
      }

      if (input.set_code) {
        filters.push(
          sql.fragment`p.set_code = ${input.set_code.toLowerCase()}`
        );
      }

      // Exact color filtering: show only cards with exactly the selected colors
      if (input.colors && input.colors.length > 0) {
        filters.push(sql.fragment`EXISTS (
          SELECT 1
          FROM card_design_colors cdc
          WHERE cdc.design_id = d.oracle_id
          GROUP BY cdc.design_id
          HAVING
            COUNT(*) = ${input.colors.length}
            AND COUNT(*) FILTER (WHERE cdc.color_id = ANY(${sql.array(input.colors, 'text')})) = ${input.colors.length}
        )`);
      }

      const whereClause =
        filters.length > 0
          ? sql.fragment`WHERE ${sql.join(filters, sql.fragment` AND `)}`
          : sql.fragment``;

      // For grouped results, we need to determine sort based on design or representative printing
      const outerSortColumn = input.orderBy === 'name' ? 'name' : input.orderBy;
      const sortDir =
        input.orderDir === 'ASC' ? sql.fragment`ASC` : sql.fragment`DESC`;

      // 1. Fetch total count of unique designs matching the filters
      const countResult = await pool.one(sql.type(
        z.object({ total: z.number() })
      )`
        SELECT COUNT(DISTINCT d.oracle_id)::int as total
        FROM card_designs d
        JOIN card_printings p ON d.oracle_id = p.design_id
        ${whereClause}
      `);

      // 2. Fetch grouped results with one representative printing per design
      const results = await pool.any(sql.type(
        z.object({
          oracle_id: z.string(),
          representative_printing_id: z.string(),
          name: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          image_uri_normal: z.string().nullable(),
          price_usd: z.number().nullable(),
          printing_count: z.number(),
        })
      )`
        WITH grouped AS (
          SELECT DISTINCT ON (d.oracle_id)
                 d.oracle_id,
                 p.id as representative_printing_id,
                 d.name,
                 s.name as set_name,
                 p.set_code,
                 p.rarity,
                 p.image_uri_normal,
                 p.price_usd,
                 s.released_at,
                 (SELECT COUNT(*)::int FROM card_printings WHERE design_id = d.oracle_id) as printing_count
          FROM card_designs d
          JOIN card_printings p ON d.oracle_id = p.design_id
          JOIN card_sets s ON p.set_code = s.code
          ${whereClause}
          ORDER BY d.oracle_id, s.released_at DESC NULLS LAST
        )
        SELECT oracle_id, representative_printing_id, name, set_name, set_code,
               rarity, image_uri_normal, price_usd, printing_count
        FROM grouped
        ORDER BY ${sql.identifier([outerSortColumn])} ${sortDir} NULLS LAST
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
      // Group by design, return one result per unique card with printing count
      return await pool.any(sql.type(
        z.object({
          oracle_id: z.string(),
          name: z.string(),
          representative_printing_id: z.string(),
          image_uri_normal: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          price_usd: z.number().nullable(),
          printing_count: z.number(),
        })
      )`
        SELECT DISTINCT ON (d.oracle_id)
               d.oracle_id,
               d.name,
               p.id as representative_printing_id,
               p.image_uri_normal,
               s.name as set_name,
               p.set_code,
               p.price_usd,
               (SELECT COUNT(*)::int FROM card_printings WHERE design_id = d.oracle_id) as printing_count
        FROM card_designs d
        JOIN card_printings p ON d.oracle_id = p.design_id
        JOIN card_sets s ON p.set_code = s.code
        WHERE d.name ILIKE ${'%' + input.query + '%'}
        ORDER BY d.oracle_id, s.released_at DESC NULLS LAST
        LIMIT 5
      `);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          oracle_id: z.string(),
          name: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          image_uri_normal: z.string().nullable(),
          price_usd: z.number().nullable(),
          oracle_text: z.string().nullable(),
          type_line: z.string().nullable(),
          mana_cost: z.string().nullable(),
        })
      )`
      SELECT p.id,
             d.oracle_id,
             d.name,
             s.name as set_name,
             p.set_code,
             p.rarity,
             p.image_uri_normal,
             p.price_usd,
             d.oracle_text,
             d.type_line,
             d.mana_cost
      FROM card_designs d
             JOIN card_printings p ON d.oracle_id = p.design_id
             JOIN card_sets s ON p.set_code = s.code
      WHERE p.id = ${input.id}
    `);
    }),

  // Get card design by oracle_id with all printings
  getByOracleId: publicProcedure
    .input(z.object({ oracleId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Fetch the design
      const design = await pool.maybeOne(sql.type(
        z.object({
          oracle_id: z.string(),
          name: z.string(),
          mana_cost: z.string().nullable(),
          type_line: z.string().nullable(),
          oracle_text: z.string().nullable(),
          cmc: z.number().nullable(),
        })
      )`
        SELECT oracle_id, name, mana_cost, type_line, oracle_text, cmc
        FROM card_designs
        WHERE oracle_id = ${input.oracleId}
      `);

      if (!design) return null;

      // Fetch all printings for this design
      const printings = await pool.any(sql.type(
        z.object({
          id: z.string(),
          set_code: z.string(),
          set_name: z.string(),
          collector_number: z.string().nullable(),
          rarity: z.string(),
          image_uri_normal: z.string().nullable(),
          price_usd: z.number().nullable(),
          artist: z.string().nullable(),
          released_at: z.string().nullable(),
        })
      )`
        SELECT p.id, p.set_code, s.name as set_name, p.collector_number,
               p.rarity, p.image_uri_normal, p.price_usd, p.artist,
               s.released_at::text
        FROM card_printings p
        JOIN card_sets s ON p.set_code = s.code
        WHERE p.design_id = ${input.oracleId}
        ORDER BY s.released_at DESC NULLS LAST
      `);

      // Fetch colors for this design
      const colors = await pool.any(sql.type(
        z.object({ color_id: z.string() })
      )`
        SELECT color_id
        FROM card_design_colors
        WHERE design_id = ${input.oracleId}
      `);

      return {
        ...design,
        colors: colors.map(c => c.color_id),
        printings,
      };
    }),

  // Get all printings for a design (for edition picker)
  getPrintingsForDesign: publicProcedure
    .input(
      z.object({
        oracleId: z.string().uuid(),
        sortBy: z
          .enum(['released_at', 'price_usd', 'set_name'])
          .default('released_at'),
        sortDir: z.enum(['ASC', 'DESC']).default('DESC'),
      })
    )
    .query(async ({ input }) => {
      const sortColumn =
        input.sortBy === 'set_name'
          ? sql.identifier(['s', 'name'])
          : input.sortBy === 'released_at'
            ? sql.identifier(['s', 'released_at'])
            : sql.identifier(['p', 'price_usd']);
      const sortDir =
        input.sortDir === 'ASC' ? sql.fragment`ASC` : sql.fragment`DESC`;

      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          set_code: z.string(),
          set_name: z.string(),
          collector_number: z.string().nullable(),
          rarity: z.string(),
          image_uri_normal: z.string().nullable(),
          price_usd: z.number().nullable(),
          artist: z.string().nullable(),
          released_at: z.string().nullable(),
        })
      )`
        SELECT p.id, p.set_code, s.name as set_name, p.collector_number,
               p.rarity, p.image_uri_normal, p.price_usd, p.artist,
               s.released_at::text
        FROM card_printings p
        JOIN card_sets s ON p.set_code = s.code
        WHERE p.design_id = ${input.oracleId}
        ORDER BY ${sortColumn} ${sortDir} NULLS LAST
      `);
    }),
});
