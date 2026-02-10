import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const binderRouter = router({
  // Get current user's binder (creates one if doesn't exist)
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const username = ctx.session.user.name || 'My Collection';

    // Try to get existing binder
    let binder = await pool.maybeOne(sql.type(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        is_public: z.boolean(),
      })
    )`
      SELECT id, name, description, is_public
      FROM binders
      WHERE user_id = ${userId} LIMIT 1
    `);

    // Create binder if doesn't exist (public by default)
    if (!binder) {
      binder = await pool.one(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          is_public: z.boolean(),
        })
      )`
        INSERT INTO binders (user_id, name, description, type, is_public)
        VALUES (${userId}, ${`${username}'s Collection`}, NULL, 'personal',
                TRUE) RETURNING id, name, description, is_public
      `);

      // Set as default binder
      await pool.query(sql.type(z.object({}))`
        UPDATE users
        SET default_binder_id = ${binder.id}
        WHERE id = ${userId}
      `);
    }

    // Fetch cards in binder
    const cards = await pool.any(sql.type(
      z.object({
        id: z.string(),
        printing_id: z.string(),
        oracle_id: z.string(),
        name: z.string(),
        image_uri_normal: z.string().nullable(),
        condition: z.string().nullable(),
        is_foil: z.boolean(),
        language: z.string(),
        set_name: z.string(),
        set_code: z.string(),
        rarity: z.string(),
        price_usd: z.number().nullable(),
        acquired_at: z.string(),
      })
    )`
      SELECT uc.id,
             uc.printing_id,
             d.oracle_id,
             d.name,
             p.image_uri_normal,
             uc.condition,
             uc.is_foil,
             uc.language,
             s.name as set_name,
             p.set_code,
             p.rarity,
             p.price_usd,
             uc.acquired_at::text
      FROM user_cards uc
             JOIN card_printings p ON uc.printing_id = p.id
             JOIN card_designs d ON p.design_id = d.oracle_id
             JOIN card_sets s ON p.set_code = s.code
      WHERE uc.user_id = ${userId}
      ORDER BY uc.acquired_at DESC
    `);

    return {
      ...binder,
      cards,
      cardCount: cards.length,
    };
  }),

  // For backwards compatibility - returns binder ID
  // For backwards compatibility - returns binder ID
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get or create binder
    const existingBinder = await pool.maybeOne(sql.type(
      z.object({
        id: z.string(),
        name: z.string(),
        card_count: z.number(),
      })
    )`
      SELECT b.id, b.name, COUNT(uc.id) ::int as card_count
      FROM binders b
             LEFT JOIN user_cards uc ON uc.user_id = b.user_id
      WHERE b.user_id = ${userId}
      GROUP BY b.id LIMIT 1
    `); // <--- Ensure the closing ')' is here before the ';'

    if (!existingBinder) {
      // Create default binder
      const username = ctx.session.user.name || 'My Collection';
      const newBinder = await pool.one(sql.type(z.object({ id: z.string() }))`
        INSERT INTO binders (user_id, name, type, is_public)
        VALUES (${userId}, ${`${username}'s Collection`}, 'personal', TRUE) RETURNING id
      `);

      await pool.query(sql.type(z.object({}))`
        UPDATE users
        SET default_binder_id = ${newBinder.id}
        WHERE id = ${userId}
      `);

      return {
        binders: [
          { id: newBinder.id, name: `${username}'s Collection`, card_count: 0 },
        ],
        defaultBinderId: newBinder.id,
      };
    }

    return {
      binders: [existingBinder],
      defaultBinderId: existingBinder.id,
    };
  }),

  // Update binder settings
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const updates = [];

      if (input.name !== undefined)
        updates.push(sql.fragment`name = ${input.name}`);
      if (input.description !== undefined)
        updates.push(sql.fragment`description = ${input.description}`);
      if (input.isPublic !== undefined)
        updates.push(sql.fragment`is_public = ${input.isPublic}`);

      if (updates.length === 0) return { success: true };

      await pool.query(sql.type(z.object({}))`
        UPDATE binders
        SET ${sql.join(updates, sql.fragment`, `)}
        WHERE user_id = ${userId}
      `);

      return { success: true };
    }),

  // Remove a card from inventory
  removeCard: protectedProcedure
    .input(z.object({ userCardId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await pool.query(sql.type(z.object({}))`
        DELETE
        FROM user_cards
        WHERE id = ${input.userCardId}
          AND user_id = ${userId}
      `);

      return { success: true };
    }),

  // Batch remove cards
  removeCards: protectedProcedure
    .input(z.object({ userCardIds: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await pool.query(sql.type(z.object({}))`
        DELETE
        FROM user_cards
        WHERE id = ANY (${sql.array(input.userCardIds, 'uuid')})
          AND user_id = ${userId}
      `);

      return { success: true, removedCount: input.userCardIds.length };
    }),

  // Get public binder by username
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const binder = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          user_id: z.string(),
          username: z.string(),
        })
      )`
        SELECT b.id, b.name, b.description, b.user_id, u.username
        FROM binders b
               JOIN users u ON b.user_id = u.id
        WHERE u.username = ${input.username}
          AND b.is_public = TRUE LIMIT 1
      `);

      if (!binder) return null;

      const cards = await pool.any(sql.type(
        z.object({
          id: z.string(),
          printing_id: z.string(),
          oracle_id: z.string(),
          name: z.string(),
          image_uri_normal: z.string().nullable(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          price_usd: z.number().nullable(),
        })
      )`
        SELECT uc.id,
               uc.printing_id,
               d.oracle_id,
               d.name,
               p.image_uri_normal,
               uc.condition,
               uc.is_foil,
               uc.language,
               s.name as set_name,
               p.set_code,
               p.rarity,
               p.price_usd
        FROM user_cards uc
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        JOIN binders b ON uc.user_id = b.user_id
        WHERE b.id = ${binder.id}
        ORDER BY uc.acquired_at DESC
      `);

      return {
        ...binder,
        cards,
        cardCount: cards.length,
      };
    }),

  // Keep getPublic for backwards compatibility (by binder ID)
  getPublic: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const binder = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          user_id: z.string(),
          username: z.string(),
        })
      )`
        SELECT b.id, b.name, b.description, b.user_id, u.username
        FROM binders b
               JOIN users u ON b.user_id = u.id
        WHERE b.id = ${input.id}
          AND b.is_public = TRUE
      `);

      if (!binder) return null;

      const cards = await pool.any(sql.type(
        z.object({
          id: z.string(),
          printing_id: z.string(),
          oracle_id: z.string(),
          name: z.string(),
          image_uri_normal: z.string().nullable(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          price_usd: z.number().nullable(),
        })
      )`
        SELECT uc.id,
               uc.printing_id,
               d.oracle_id,
               d.name,
               p.image_uri_normal,
               uc.condition,
               uc.is_foil,
               uc.language,
               s.name as set_name,
               p.set_code,
               p.rarity,
               p.price_usd
        FROM user_cards uc
               JOIN card_printings p ON uc.printing_id = p.id
               JOIN card_designs d ON p.design_id = d.oracle_id
               JOIN card_sets s ON p.set_code = s.code
               JOIN binders b ON uc.user_id = b.user_id
        WHERE b.id = ${input.id}
        ORDER BY uc.acquired_at DESC
      `);

      return {
        ...binder,
        cards,
        cardCount: cards.length,
      };
    }),

  // Get public sellers (users with public binders)
  getPublicSellers: publicProcedure
    .input(z.object({ limit: z.number().default(12) }))
    .query(async ({ input }) => {
      return await pool.any(sql.type(
        z.object({
          user_id: z.string(),
          username: z.string(),
          binder_name: z.string(),
          card_count: z.number(),
          total_value: z.number().nullable(),
          preview_images: z.array(z.string().nullable()),
        })
      )`
        SELECT
          u.id as user_id,
          u.username,
          b.name as binder_name,
          COUNT(uc.id)::int as card_count,
          SUM(p.price_usd)::numeric as total_value,
          ARRAY(
            SELECT p2.image_uri_normal
            FROM user_cards uc2
            JOIN card_printings p2 ON uc2.printing_id = p2.id
            WHERE uc2.user_id = u.id
            ORDER BY uc2.acquired_at DESC
            LIMIT 4
          ) as preview_images
        FROM users u
        JOIN binders b ON b.user_id = u.id AND b.is_public = TRUE
        LEFT JOIN user_cards uc ON uc.user_id = u.id
        LEFT JOIN card_printings p ON uc.printing_id = p.id
        GROUP BY u.id, u.username, b.name
        HAVING COUNT(uc.id) > 0
        ORDER BY COUNT(uc.id) DESC
        LIMIT ${input.limit}
      `);
    }),
});
