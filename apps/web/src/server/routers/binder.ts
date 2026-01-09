import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import { TRPCError } from '@trpc/server';

export const binderRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['personal', 'trade', 'sale']).default('personal'),
        isPublic: z.boolean().default(false),
        targetCapacity: z.number().int().positive().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Count existing binders for this user
      const { count } = await pool.one(sql.type(
        z.object({
          count: z.number(),
        })
      )`
        SELECT COUNT(*) ::int AS count
        FROM binders
        WHERE user_id = ${userId}`);

      const MAX_BINDERS = 5;

      // Enforce limits
      if (count >= MAX_BINDERS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Binder limit reached (free accounts can create up to 5 binders)',
        });
      }

      // Create binder
      const newBinder = await pool.one(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        INSERT INTO binders (user_id, name, description, type, is_public, target_capacity)
        VALUES (${userId}, ${input.name}, ${input.description || null}, ${input.type}, ${input.isPublic}, ${input.targetCapacity || null}) RETURNING id
      `);

      // If this is the user's first binder, set it as default
      if (count === 0) {
        await pool.query(sql.type(z.object({}))`
          UPDATE users
          SET default_binder_id = ${newBinder.id}
          WHERE id = ${userId}
        `);
      }

      return newBinder;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user's default binder ID
    const userInfo = await pool.maybeOne(sql.type(
      z.object({
        default_binder_id: z.string().nullable(),
      })
    )`
      SELECT default_binder_id
      FROM users
      WHERE id = ${userId}
    `);

    const binders = await pool.any(sql.type(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        type: z.string(),
        is_public: z.boolean(),
        card_count: z.number(),
        target_capacity: z.number().nullable(),
      })
    )`
      SELECT b.id, b.name, b.description, b.type, b.is_public, b.target_capacity, COUNT(uc.id) ::int as card_count
      FROM binders b
             LEFT JOIN user_cards uc ON b.id = uc.binder_id
      WHERE b.user_id = ${userId}
      GROUP BY b.id
      ORDER BY b.name ASC
    `);

    const MAX_BINDERS = 5; // later: derive from plan

    return {
      binders,
      defaultBinderId: userInfo?.default_binder_id || null,
      limits: {
        maxBinders: MAX_BINDERS,
        binderCount: binders.length,
        canCreateBinder: binders.length < MAX_BINDERS,
      },
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const binder = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          type: z.string(),
          is_public: z.boolean(),
          target_capacity: z.number().nullable(),
        })
      )`
        SELECT id, name, description, type, is_public, target_capacity
        FROM binders
        WHERE id = ${input.id}
          AND user_id = ${userId}
      `);

      if (!binder) return null;

      const cards = await pool.any(sql.type(
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
          rarity: z.string(),
        })
      )`
        SELECT uc.id,
               uc.printing_id,
               d.name,
               p.image_uri_normal,
               uc.condition,
               uc.is_foil,
               uc.language,
               s.name as set_name,
               p.set_code,
               p.rarity
        FROM user_cards uc
               JOIN card_printings p ON uc.printing_id = p.id
               JOIN card_designs d ON p.design_id = d.oracle_id
               JOIN card_sets s ON p.set_code = s.code
        WHERE uc.binder_id = ${input.id}
        ORDER BY uc.acquired_at DESC
      `);

      return {
        ...binder,
        cards,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['personal', 'trade', 'sale']).optional(),
        isPublic: z.boolean().optional(),
        targetCapacity: z.number().int().positive().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const updates = [];
      if (input.name !== undefined)
        updates.push(sql.fragment`name = ${input.name}`);
      if (input.description !== undefined)
        updates.push(sql.fragment`description = ${input.description}`);
      if (input.type !== undefined)
        updates.push(sql.fragment`type = ${input.type}`);
      if (input.isPublic !== undefined)
        updates.push(sql.fragment`is_public = ${input.isPublic}`);
      if (input.targetCapacity !== undefined)
        updates.push(sql.fragment`target_capacity = ${input.targetCapacity}`);

      if (updates.length === 0) return { success: true };

      await pool.query(sql.type(z.object({}))`
        UPDATE binders
        SET ${sql.join(updates, sql.fragment`, `)}
        WHERE id = ${input.id}
          AND user_id = ${userId}
      `);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Get user's current default binder
      const userInfo = await pool.maybeOne(sql.type(
        z.object({
          default_binder_id: z.string().nullable(),
        })
      )`
        SELECT default_binder_id
        FROM users
        WHERE id = ${userId}
      `);

      const isDeletingDefault = userInfo?.default_binder_id === input.id;

      // Delete the binder (cards will be unassigned due to ON DELETE SET NULL)
      await pool.query(sql.type(z.object({}))`
        DELETE
        FROM binders
        WHERE id = ${input.id}
          AND user_id = ${userId}
      `);

      // If we deleted the default binder, set a new default
      if (isDeletingDefault) {
        // Select first remaining binder as new default
        const newDefaultBinder = await pool.maybeOne(sql.type(
          z.object({ id: z.string() })
        )`
          SELECT id
          FROM binders
          WHERE user_id = ${userId}
          ORDER BY name ASC
          LIMIT 1
        `);

        // Update user's default (will be NULL if no binders remain)
        await pool.query(sql.type(z.object({}))`
          UPDATE users
          SET default_binder_id = ${newDefaultBinder?.id || null}
          WHERE id = ${userId}
        `);
      }

      return { success: true };
    }),

  assignCard: protectedProcedure
    .input(
      z.object({
        userCardId: z.string().uuid(),
        binderId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      // Verify binder belongs to user
      const binder = await pool.maybeOne(sql.type(z.object({ id: z.string() }))`
        SELECT id
        FROM binders
        WHERE id = ${input.binderId}
          AND user_id = ${userId}
      `);
      if (!binder) throw new Error('Binder not found or unauthorized');

      await pool.query(sql.type(z.object({}))`
        UPDATE user_cards
        SET binder_id = ${input.binderId}
        WHERE id = ${input.userCardId}
          AND user_id = ${userId}
      `);
      return { success: true };
    }),

  batchAssignCards: protectedProcedure
    .input(
      z.object({
        userCardIds: z.array(z.string().uuid()),
        binderId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const binder = await pool.maybeOne(sql.type(z.object({ id: z.string() }))`
        SELECT id
        FROM binders
        WHERE id = ${input.binderId}
          AND user_id = ${userId}
      `);

      if (!binder)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Binder not found' });

      // Get rarity info for cards being assigned
      const assignedCards = await pool.any(sql.type(
        z.object({
          id: z.string(),
          rarity: z.string(),
        })
      )`
        SELECT uc.id, p.rarity
        FROM user_cards uc
        JOIN card_printings p ON uc.printing_id = p.id
        WHERE uc.id = ANY(${sql.array(input.userCardIds, 'uuid')})
          AND uc.user_id = ${userId}
      `);

      // Perform assignment
      await pool.query(sql.type(z.object({}))`
        UPDATE user_cards
        SET binder_id = ${input.binderId}
        WHERE id = ANY(${sql.array(input.userCardIds, 'uuid')})
          AND user_id = ${userId}
      `);

      // Get updated binder stats
      const binderStats = await pool.one(sql.type(
        z.object({
          card_count: z.number(),
          target_capacity: z.number().nullable(),
        })
      )`
        SELECT
          COUNT(uc.id)::int as card_count,
          b.target_capacity
        FROM binders b
        LEFT JOIN user_cards uc ON b.id = uc.binder_id
        WHERE b.id = ${input.binderId}
        GROUP BY b.id, b.target_capacity
      `);

      return {
        success: true,
        updatedCount: input.userCardIds.length,
        assignedCards: assignedCards.map(c => c.rarity),
        cardCount: binderStats.card_count,
        targetCapacity: binderStats.target_capacity,
      };
    }),

  unassignCard: protectedProcedure
    .input(z.object({ userCardId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      await pool.query(sql.type(z.object({}))`
        UPDATE user_cards
        SET binder_id = NULL
        WHERE id = ${input.userCardId}
          AND user_id = ${userId}
      `);
      return { success: true };
    }),

  setAsDefault: protectedProcedure
    .input(z.object({ binderId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Verify binder belongs to user
      const binder = await pool.maybeOne(sql.type(z.object({ id: z.string() }))`
        SELECT id
        FROM binders
        WHERE id = ${input.binderId} AND user_id = ${userId}
      `);

      if (!binder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Binder not found or unauthorized',
        });
      }

      // Update user's default binder
      await pool.query(sql.type(z.object({}))`
        UPDATE users
        SET default_binder_id = ${input.binderId}
        WHERE id = ${userId}
      `);

      return { success: true };
    }),

  getPublic: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const binder = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          type: z.string(),
          user_id: z.string(),
          username: z.string(),
        })
      )`
      SELECT b.id, b.name, b.description, b.type, b.user_id, u.username
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
          name: z.string(),
          image_uri_normal: z.string().nullable(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          language: z.string(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
        })
      )`
      SELECT uc.id,
             uc.printing_id,
             d.name,
             p.image_uri_normal,
             uc.condition,
             uc.is_foil,
             uc.language,
             s.name as set_name,
             p.set_code,
             p.rarity
      FROM user_cards uc
             JOIN card_printings p ON uc.printing_id = p.id
             JOIN card_designs d ON p.design_id = d.oracle_id
             JOIN card_sets s ON p.set_code = s.code
      WHERE uc.binder_id = ${input.id}
      ORDER BY uc.acquired_at DESC
    `);

      return {
        ...binder,
        cards,
      };
    }),
});
