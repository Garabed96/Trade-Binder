import { z } from 'zod';
import { router, protectedProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import { TRPCError } from '@trpc/server';

export const inquiryRouter = router({
  // Buyer: Get my sent inquiries
  myInquiries: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'accepted', 'declined', 'completed'])
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const filters = [sql.fragment`i.buyer_id = ${userId}`];

      if (input.status) {
        filters.push(sql.fragment`i.status = ${input.status}`);
      }

      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          listing_id: z.string(),
          message: z.string().nullable(),
          status: z.string(),
          created_at: z.string(),
          listing_price: z.number(),
          card_name: z.string(),
          card_image: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          seller_username: z.string(),
          seller_email: z.string().nullable(), // Only shown if accepted
        })
      )`
        SELECT
          i.id, i.listing_id, i.message, i.status, i.created_at::text,
          l.price as listing_price,
          d.name as card_name,
          p.image_uri_normal as card_image,
          s.name as set_name,
          p.set_code,
          u.username as seller_username,
          CASE
            WHEN i.status = 'accepted' THEN u.email
            ELSE NULL
          END as seller_email
        FROM inquiries i
        JOIN listings l ON i.listing_id = l.id
        JOIN user_cards uc ON l.user_card_id = uc.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        JOIN users u ON i.seller_id = u.id
        WHERE ${sql.join(filters, sql.fragment` AND `)}
        ORDER BY i.created_at DESC
      `);
    }),

  // Seller: Get received inquiries
  receivedInquiries: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid().optional(),
        status: z
          .enum(['pending', 'accepted', 'declined', 'completed'])
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const filters = [sql.fragment`i.seller_id = ${userId}`];

      if (input.listingId) {
        filters.push(sql.fragment`i.listing_id = ${input.listingId}`);
      }

      if (input.status) {
        filters.push(sql.fragment`i.status = ${input.status}`);
      }

      return await pool.any(sql.type(
        z.object({
          id: z.string(),
          listing_id: z.string(),
          message: z.string().nullable(),
          status: z.string(),
          created_at: z.string(),
          listing_price: z.number(),
          card_name: z.string(),
          card_image: z.string().nullable(),
          set_name: z.string(),
          set_code: z.string(),
          buyer_username: z.string(),
          buyer_email: z.string(), // Always shown to seller
        })
      )`
        SELECT
          i.id, i.listing_id, i.message, i.status, i.created_at::text,
          l.price as listing_price,
          d.name as card_name,
          p.image_uri_normal as card_image,
          s.name as set_name,
          p.set_code,
          u.username as buyer_username,
          u.email as buyer_email
        FROM inquiries i
        JOIN listings l ON i.listing_id = l.id
        JOIN user_cards uc ON l.user_card_id = uc.id
        JOIN card_printings p ON uc.printing_id = p.id
        JOIN card_designs d ON p.design_id = d.oracle_id
        JOIN card_sets s ON p.set_code = s.code
        JOIN users u ON i.buyer_id = u.id
        WHERE ${sql.join(filters, sql.fragment` AND `)}
        ORDER BY i.created_at DESC
      `);
    }),

  // Seller: Update inquiry status (accept, decline, complete)
  updateStatus: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string().uuid(),
        status: z.enum(['accepted', 'declined', 'completed']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Verify ownership (must be the seller)
      const inquiry = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
          seller_id: z.string(),
          listing_id: z.string(),
          status: z.string(),
        })
      )`
        SELECT id, seller_id, listing_id, status
        FROM inquiries
        WHERE id = ${input.inquiryId}
      `);

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      if (inquiry.seller_id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this inquiry',
        });
      }

      // Update inquiry status
      await pool.query(sql.type(z.object({}))`
        UPDATE inquiries
        SET status = ${input.status}
        WHERE id = ${input.inquiryId}
      `);

      // If marking as completed, update listing to sold
      if (input.status === 'completed') {
        await pool.query(sql.type(z.object({}))`
          UPDATE listings
          SET status = 'sold', updated_at = NOW()
          WHERE id = ${inquiry.listing_id}
        `);
      }

      // TODO: Send notification to buyer

      return { success: true };
    }),
});
