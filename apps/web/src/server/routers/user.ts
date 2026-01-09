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
      })
    )`
      SELECT id,
             username,
             email,
             registration_complete,
             latitude,
             longitude,
             location_name,
             bio
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session.user as { id: string }).id;
      return await pool.one(sql.type(z.object({ id: z.string() }))`
        UPDATE users
        SET username              = ${input.username},
            latitude              = ${input.latitude},
            longitude             = ${input.longitude},
            location_name         = ${input.location_name},
            bio                   = ${input.bio},
            registration_complete = TRUE
        WHERE id = ${userId} RETURNING id
      `);
    }),

  getMarketStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;
    const radiusKm = 50;

    const outputSchema = z.object({
      firstSaleDate: z.string().nullable(),
      mostValuableCardSold: z
        .object({
          cardName: z.string(),
          price: z.number(),
          currency: z.string().nullable().optional(),
        })
        .nullable(),
      mostValuableCardBought: z
        .object({
          cardName: z.string(),
          price: z.number(),
          currency: z.string().nullable().optional(),
        })
        .nullable(),
      currentBinderValue: z.number().nullable(),
      nearbyTraders: z
        .object({
          radiusKm: z.number(),
          count: z.number(),
          traders: z
            .array(
              z.object({
                id: z.string(),
                username: z.string(),
                distanceKm: z.number(),
              })
            )
            .optional()
            .nullable(),
        })
        .nullable(),
    });

    const me = await pool.one(
      sql.type(
        z.object({
          latitude: z.number().nullable(),
          longitude: z.number().nullable(),
        })
      )`
        SELECT latitude, longitude
        FROM users
        WHERE id = ${userId}
      `
    );

    const firstSale = await pool.maybeOne(
      sql.type(z.object({ first_sale_date: z.string().nullable() }))`
        SELECT MIN(uc.acquired_at) ::text as first_sale_date
        FROM user_cards uc
               JOIN binders b ON uc.binder_id = b.id
        WHERE uc.user_id = ${userId}
          AND b.type = 'sale'
      `
    );

    const mostSold = await pool.maybeOne(
      sql.type(
        z.object({
          card_name: z.string(),
          price: z.number(),
        })
      )`
        SELECT d.name as card_name, p.price_usd::float8 as price
        FROM user_cards uc
               JOIN binders b ON uc.binder_id = b.id
               JOIN card_printings p ON uc.printing_id = p.id
               JOIN card_designs d ON p.design_id = d.oracle_id
        WHERE uc.user_id = ${userId}
          AND b.type = 'sale'
          AND p.price_usd IS NOT NULL
        ORDER BY p.price_usd DESC LIMIT 1
      `
    );

    const mostBought = await pool.maybeOne(
      sql.type(
        z.object({
          card_name: z.string(),
          price: z.number(),
        })
      )`
        SELECT d.name as card_name, p.price_usd::float8 as price
        FROM user_cards uc
               LEFT JOIN binders b ON uc.binder_id = b.id
               JOIN card_printings p ON uc.printing_id = p.id
               JOIN card_designs d ON p.design_id = d.oracle_id
        WHERE uc.user_id = ${userId}
          AND (b.type IS NULL OR b.type <> 'sale')
          AND p.price_usd IS NOT NULL
        ORDER BY p.price_usd DESC LIMIT 1
      `
    );

    const binderValue = await pool.one(
      sql.type(z.object({ total: z.number().nullable() }))`
        SELECT COALESCE(SUM(p.price_usd), 0) ::float8 as total
        FROM user_cards uc
               JOIN card_printings p ON uc.printing_id = p.id
        WHERE uc.user_id = ${userId}
      `
    );

    if (me.latitude == null || me.longitude == null) {
      return outputSchema.parse({
        firstSaleDate: firstSale?.first_sale_date ?? null,
        mostValuableCardSold: mostSold
          ? {
              cardName: mostSold.card_name,
              price: mostSold.price,
              currency: 'USD',
            }
          : null,
        mostValuableCardBought: mostBought
          ? {
              cardName: mostBought.card_name,
              price: mostBought.price,
              currency: 'USD',
            }
          : null,
        currentBinderValue: binderValue.total,
        nearbyTraders: { radiusKm, count: 0, traders: [] },
      });
    }

    const traders = await pool.any(
      sql.type(
        z.object({
          id: z.string(),
          username: z.string(),
          distance_km: z.number(),
        })
      )`
        SELECT u.id,
               u.username,
               (
                 6371 * acos(
                   cos(radians(${me.latitude})) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(${me.longitude})) +
                   sin(radians(${me.latitude})) * sin(radians(u.latitude))
                        )
                 ) ::float8 as distance_km
        FROM users u
        WHERE u.id <> ${userId}
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
        ORDER BY distance_km ASC LIMIT 50
      `
    );

    const nearby = traders.filter(t => t.distance_km <= radiusKm);

    return outputSchema.parse({
      firstSaleDate: firstSale?.first_sale_date ?? null,
      mostValuableCardSold: mostSold
        ? {
            cardName: mostSold.card_name,
            price: mostSold.price,
            currency: 'USD',
          }
        : null,
      mostValuableCardBought: mostBought
        ? {
            cardName: mostBought.card_name,
            price: mostBought.price,
            currency: 'USD',
          }
        : null,
      currentBinderValue: binderValue.total,
      nearbyTraders: {
        radiusKm,
        count: nearby.length,
        traders: nearby.map(t => ({
          id: t.id,
          username: t.username,
          distanceKm: t.distance_km,
        })),
      },
    });
  }),

  list: publicProcedure.query(async () => {
    return await pool.any(sql.type(
      z.object({
        id: z.string(),
        username: z.string(),
      })
    )`
      SELECT id, username
      FROM users
    `);
  }),

  getDefaultBinder: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    const result = await pool.maybeOne(sql.type(
      z.object({
        default_binder_id: z.string().nullable(),
      })
    )`
      SELECT default_binder_id
      FROM users
      WHERE id = ${userId}
    `);

    return result?.default_binder_id || null;
  }),

  create: publicProcedure
    .input(
      z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const newUser = await pool.one(sql.type(z.object({ id: z.string() }))`
        INSERT INTO users (username, email, password_hash)
        VALUES (${input.username}, ${input.email}, ${passwordHash})
        RETURNING id
      `);

      // Create default binder for new user
      const defaultBinder = await pool.one(sql.type(
        z.object({ id: z.string() })
      )`
        INSERT INTO binders (user_id, name, description, type, is_public, target_capacity)
        VALUES (
          ${newUser.id},
          'My Collection',
          'Your default collection binder',
          'trade',
          TRUE,
         250 
        )
        RETURNING id
      `);

      // Set as default binder
      await pool.query(sql.type(z.object({}))`
        UPDATE users
        SET default_binder_id = ${defaultBinder.id}
        WHERE id = ${newUser.id}
      `);

      return newUser;
    }),
});
