import { z } from 'zod';
import { router, protectedProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

export const inventoryRouter = router({
  add: protectedProcedure
    .input(
      z.object({
        printingId: z.string().uuid(),
        condition: z.string().optional(),
        isFoil: z.boolean().default(false),
        language: z.string().default('en'),
        binderId: z.string().uuid().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await pool.one(sql.type(
        z.object({
          id: z.string(),
        }),
      )`
        INSERT INTO user_cards (user_id, printing_id, binder_id, condition, is_foil, language)
        VALUES (${userId}, ${input.printingId}, ${input.binderId || null}, ${input.condition || null}, ${input.isFoil}, ${input.language})
        RETURNING id
      `);
    }),

  list: protectedProcedure
    .input(
      z.object({
        binderId: z.string().uuid().optional().nullable(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const filters = [sql.fragment`uc.user_id = ${userId}`];

      if (input.binderId !== undefined) {
        filters.push(sql.fragment`uc.binder_id = ${input.binderId || null}`);
      }

      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          printing_id: z.string(),
          name: z.string(),
          image_uri_normal: z.string().nullable(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          binder_id: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
        }),
      )`
        SELECT 
          uc.id, uc.printing_id, d.name, p.image_uri_normal, 
          uc.condition, uc.is_foil, uc.language, uc.binder_id,
          s.name as set_name, p.set_code
        FROM user_cards uc
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        WHERE ${sql.join(filters, sql.fragment` AND `)}
        ORDER BY uc.acquired_at DESC
      `);
    }),

  unallocated: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await pool.any(sql.type(
      z.object({
        id: z.string(),
        printing_id: z.string(),
        name: z.string(),
        image_uri_normal: z.string().nullable(),
        condition: z.string().nullable(),
        is_foil: z.boolean(),
        language: z.string(),
        set_name: z.string(),
        set_code: z.string(),
      }),
    )`
      SELECT 
        uc.id, uc.printing_id, d.name, p.image_uri_normal, 
        uc.condition, uc.is_foil, uc.language,
        s.name as set_name, p.set_code
      FROM user_cards uc
      JOIN card_printings p ON uc.printing_id = p.id
      JOIN card_designs d ON p.design_id = d.oracle_id
      JOIN card_sets s ON p.set_code = s.code
      WHERE uc.user_id = ${userId} AND uc.binder_id IS NULL
      ORDER BY uc.acquired_at DESC
    `);
  }),

  remove: protectedProcedure
    .input(z.object({ userCardId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      await pool.query(sql.type(z.object({}))`
        DELETE FROM user_cards 
        WHERE id = ${input.userCardId} AND user_id = ${userId}
      `);
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        userCardId: z.string().uuid(),
        condition: z.string().optional(),
        isFoil: z.boolean().optional(),
        language: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const updates = [];
      if (input.condition !== undefined) updates.push(sql.fragment`condition = ${input.condition}`);
      if (input.isFoil !== undefined) updates.push(sql.fragment`is_foil = ${input.isFoil}`);
      if (input.language !== undefined) updates.push(sql.fragment`language = ${input.language}`);

      if (updates.length === 0) return { success: true };

      await pool.query(sql.type(z.object({}))`
        UPDATE user_cards 
        SET ${sql.join(updates, sql.fragment`, `)}
        WHERE id = ${input.userCardId} AND user_id = ${userId}
      `);
      return { success: true };
    }),
});
