import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import { TRPCError } from '@trpc/server';

export const listingRouter = router({
  // Seller: Create a new listing
  create: protectedProcedure
    .input(
      z.object({
        userCardId: z.string().uuid(),
        price: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Verify card ownership
      const card = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          user_id: z.string(),
        })
      )`
        SELECT id, user_id
        FROM user_cards
        WHERE id = ${input.userCardId}
      `);

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
      }

      if (card.user_id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this card',
        });
      }

      // Check for existing active listing
      const existingListing = await pool.maybeOne(sql.type(
        z.object({ id: z.string() })
      )`
        SELECT id
        FROM listings
        WHERE user_card_id = ${input.userCardId} AND status = 'active'
      `);

      if (existingListing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This card already has an active listing',
        });
      }

      // Create listing
      return await pool.one(sql.type(
        z.object({
          id: z.string(),
          price: z.number(),
          status: z.string(),
        })
      )`
        INSERT INTO listings (user_card_id, user_id, price)
        VALUES (${input.userCardId}, ${userId}, ${input.price})
        RETURNING id, price, status
      `);
    }),

  // Seller: Get my listings
  myListings: protectedProcedure
    .input(
      z.object({
        status: z.enum(['active', 'sold', 'cancelled']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const filters = [sql.fragment`l.user_id = ${userId}`];

      if (input.status) {
        filters.push(sql.fragment`l.status = ${input.status}`);
      }

      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          price: z.number(),
          status: z.string(),
          created_at: z.string(),
          user_card_id: z.string(),
          card_name: z.string(),
          card_image: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          inquiry_count: z.number(),
        })
      )`
        SELECT
          l.id, l.price, l.status, l.created_at::text, l.user_card_id,
          d.name as card_name,
          p.image_uri_normal as card_image,
          s.name as set_name,
          p.set_code,
          p.rarity,
          uc.condition,
          uc.is_foil,
          (SELECT COUNT(*) FROM inquiries i WHERE i.listing_id = l.id)::int as inquiry_count
        FROM listings l
        JOIN user_cards uc ON l.user_card_id = uc.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        WHERE ${sql.join(filters, sql.fragment` AND `)}
        ORDER BY l.created_at DESC
      `);
    }),

  // Seller: Update listing price
  update: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        price: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Verify ownership and active status
      const listing = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          user_id: z.string(),
          status: z.string(),
        })
      )`
        SELECT id, user_id, status
        FROM listings
        WHERE id = ${input.listingId}
      `);

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        });
      }

      if (listing.user_id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this listing',
        });
      }

      if (listing.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update a non-active listing',
        });
      }

      await pool.query(sql.type(z.object({}))`
        UPDATE listings
        SET price = ${input.price}, updated_at = NOW()
        WHERE id = ${input.listingId}
      `);

      return { success: true };
    }),

  // Seller: Cancel listing
  cancel: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const listing = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          user_id: z.string(),
          status: z.string(),
        })
      )`
        SELECT id, user_id, status
        FROM listings
        WHERE id = ${input.listingId}
      `);

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        });
      }

      if (listing.user_id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this listing',
        });
      }

      if (listing.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Listing is already cancelled or sold',
        });
      }

      await pool.query(sql.type(z.object({}))`
        UPDATE listings
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${input.listingId}
      `);

      // TODO: Notify buyers with pending inquiries

      return { success: true };
    }),

  // Buyer: Send inquiry on a listing
  sendInquiry: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Get listing details and verify it's active
      const listing = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          user_id: z.string(),
          status: z.string(),
        })
      )`
        SELECT id, user_id, status
        FROM listings
        WHERE id = ${input.listingId}
      `);

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        });
      }

      if (listing.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This listing is no longer active',
        });
      }

      if (listing.user_id === userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot inquire on your own listing',
        });
      }

      // Create inquiry
      const inquiry = await pool.one(sql.type(
        z.object({
          id: z.string(),
          created_at: z.string(),
        })
      )`
        INSERT INTO inquiries (listing_id, buyer_id, seller_id, message)
        VALUES (${input.listingId}, ${userId}, ${listing.user_id}, ${input.message || null})
        RETURNING id, created_at::text
      `);

      // TODO: Send notification to seller

      return inquiry;
    }),

  // Public: Search marketplace listings
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        setCode: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(40),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const filters = [sql.fragment`l.status = 'active'`];

      if (input.query && input.query.trim().length >= 1) {
        filters.push(sql.fragment`d.name ILIKE ${'%' + input.query + '%'}`);
      }

      if (input.minPrice !== undefined) {
        filters.push(sql.fragment`l.price >= ${input.minPrice}`);
      }

      if (input.maxPrice !== undefined) {
        filters.push(sql.fragment`l.price <= ${input.maxPrice}`);
      }

      if (input.setCode) {
        filters.push(sql.fragment`p.set_code = ${input.setCode.toLowerCase()}`);
      }

      // Get total count
      const countResult = await pool.one(sql.type(
        z.object({ total: z.number() })
      )`
        SELECT COUNT(*)::int as total
        FROM listings l
        JOIN user_cards uc ON l.user_card_id = uc.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        WHERE ${sql.join(filters, sql.fragment` AND `)}
      `);

      // Get listings
      const results = await pool.any(sql.type(
        z.object({
          id: z.string(),
          price: z.number(),
          created_at: z.string(),
          card_id: z.string(),
          card_name: z.string(),
          card_image: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          rarity: z.string(),
          condition: z.string().nullable(),
          is_foil: z.boolean(),
          seller_username: z.string(),
          seller_country: z.string().nullable(),
        })
      )`
        SELECT
          l.id, l.price, l.created_at::text,
          uc.id as card_id,
          d.name as card_name,
          p.image_uri_normal as card_image,
          s.name as set_name,
          p.set_code,
          p.rarity,
          uc.condition,
          uc.is_foil,
          u.username as seller_username,
          u.country_code as seller_country
        FROM listings l
        JOIN user_cards uc ON l.user_card_id = uc.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        JOIN users u ON l.user_id = u.id
        WHERE ${sql.join(filters, sql.fragment` AND `)}
        ORDER BY l.created_at DESC
        LIMIT ${input.limit}
        OFFSET ${offset}
      `);

      return {
        listings: results,
        totalCount: countResult.total,
        totalPages: Math.ceil(countResult.total / input.limit),
      };
    }),
});
