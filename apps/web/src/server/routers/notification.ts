import { z } from 'zod';
import { router, protectedProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  link: z.string().nullable(),
  metadata: z.any(),
  created_at: z.string(),
  read_at: z.string().nullable(),
});

export const notificationRouter = router({
  /**
   * Get all notifications for the current user
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { limit, offset, unreadOnly } = input;

      if (unreadOnly) {
        return await pool.any(sql.type(notificationSchema)`
          SELECT
            id,
            type,
            title,
            message,
            read,
            link,
            metadata,
            created_at::text,
            read_at::text
          FROM notifications
          WHERE user_id = ${userId}
            AND read = FALSE
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `);
      }

      return await pool.any(sql.type(notificationSchema)`
        SELECT
          id,
          type,
          title,
          message,
          read,
          link,
          metadata,
          created_at::text,
          read_at::text
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    const result = await pool.one(sql.type(
      z.object({
        count: z.number(),
      })
    )`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE user_id = ${userId} AND read = FALSE
    `);

    return result.count;
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      await pool.query(sql.type(z.object({}))`
        UPDATE notifications
        SET read = TRUE, read_at = NOW()
        WHERE id = ${input.id} AND user_id = ${userId}
      `);

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    await pool.query(sql.type(z.object({}))`
      UPDATE notifications
      SET read = TRUE, read_at = NOW()
      WHERE user_id = ${userId} AND read = FALSE
    `);

    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      await pool.query(sql.type(z.object({}))`
        DELETE FROM notifications
        WHERE id = ${input.id} AND user_id = ${userId}
      `);

      return { success: true };
    }),

  /**
   * Create a notification (for internal use by other routers)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const notification = await pool.one(sql.type(
        z.object({ id: z.string() })
      )`
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          ${input.userId},
          ${input.type},
          ${input.title},
          ${input.message},
          ${input.link ?? null},
          ${input.metadata ? JSON.stringify(input.metadata) : null}
        )
        RETURNING id
      `);

      return notification;
    }),
});
