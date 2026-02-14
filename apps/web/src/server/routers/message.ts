import { z } from 'zod';
import { router, protectedProcedure } from '@/src/server/trpc';
import { pool, sql } from '@/src/server/db';
import { TRPCError } from '@trpc/server';

const conversationSchema = z.object({
  id: z.string(),
  listing_id: z.string().nullable(),
  updated_at: z.string(),
  other_user_id: z.string(),
  other_user_name: z.string(),
  last_message: z.string().nullable(),
  unread_count: z.number(),
});

const messageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  sender_name: z.string(),
  content: z.string(),
  created_at: z.string(),
  edited_at: z.string().nullable(),
  deleted: z.boolean(),
});

export const messageRouter = router({
  /**
   * Get all conversations for the current user
   */
  getConversations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { limit, offset } = input;

      const conversations = await pool.any(sql.type(conversationSchema)`
        SELECT
          c.id,
          c.listing_id,
          c.updated_at::text,
          other_user.id as other_user_id,
          other_user.username as other_user_name,
          (
            SELECT content
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*)::int
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.created_at > cp.last_read_at
              AND m.sender_id != ${userId}
          ) as unread_count
        FROM conversations c
        INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
        INNER JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id
        INNER JOIN users other_user ON other_user.id = other_cp.user_id
        WHERE cp.user_id = ${userId}
          AND other_cp.user_id != ${userId}
        ORDER BY c.updated_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      return conversations;
    }),

  /**
   * Get messages for a specific conversation
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { conversationId, limit, offset } = input;

      // Verify user is a participant
      const participant = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        SELECT id
        FROM conversation_participants
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a participant in this conversation',
        });
      }

      const messages = await pool.any(sql.type(messageSchema)`
        SELECT
          m.id,
          m.sender_id,
          u.username as sender_name,
          m.content,
          m.created_at::text,
          m.edited_at::text,
          m.deleted
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      // Update last_read_at
      await pool.query(sql.type(z.object({}))`
        UPDATE conversation_participants
        SET last_read_at = NOW()
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      // Return in chronological order (oldest to newest)
      return [...messages].reverse();
    }),

  /**
   * Start a new conversation
   */
  startConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.string(),
        listingId: z.string().optional(),
        initialMessage: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { otherUserId, listingId, initialMessage } = input;

      // Check if conversation already exists between these two users for this listing
      const existingConversation = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        SELECT c.id
        FROM conversations c
        INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
        INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
        WHERE cp1.user_id = ${userId}
          AND cp2.user_id = ${otherUserId}
          AND c.listing_id ${listingId ? sql.fragment`= ${listingId}` : sql.fragment`IS NULL`}
        LIMIT 1
      `);

      if (existingConversation) {
        // Add message to existing conversation
        await pool.query(sql.type(z.object({}))`
          INSERT INTO messages (conversation_id, sender_id, content)
          VALUES (${existingConversation.id}, ${userId}, ${initialMessage})
        `);

        await pool.query(sql.type(z.object({}))`
          UPDATE conversations
          SET updated_at = NOW()
          WHERE id = ${existingConversation.id}
        `);

        // Create notification for other user
        await pool.query(sql.type(z.object({}))`
          INSERT INTO notifications (user_id, type, title, message, link, metadata)
          VALUES (
            ${otherUserId},
            'message',
            'New message',
            ${initialMessage.substring(0, 100)},
            ${`/messages/${existingConversation.id}`},
            ${JSON.stringify({ conversationId: existingConversation.id, senderId: userId })}
          )
        `);

        return { conversationId: existingConversation.id };
      }

      // Create new conversation
      const conversation = await pool.one(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        INSERT INTO conversations (listing_id)
        VALUES (${listingId ?? null})
        RETURNING id
      `);

      // Add participants
      await pool.query(sql.type(z.object({}))`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES
          (${conversation.id}, ${userId}),
          (${conversation.id}, ${otherUserId})
      `);

      // Add initial message
      await pool.query(sql.type(z.object({}))`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversation.id}, ${userId}, ${initialMessage})
      `);

      // Create notification for other user
      await pool.query(sql.type(z.object({}))`
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          ${otherUserId},
          'message',
          'New message',
          ${initialMessage.substring(0, 100)},
          ${`/messages/${conversation.id}`},
          ${JSON.stringify({ conversationId: conversation.id, senderId: userId })}
        )
      `);

      return { conversationId: conversation.id };
    }),

  /**
   * Send a message to an existing conversation
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { conversationId, content } = input;

      // Verify user is a participant
      const participant = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        SELECT id
        FROM conversation_participants
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a participant in this conversation',
        });
      }

      // Insert message
      const message = await pool.one(sql.type(
        z.object({
          id: z.string(),
          created_at: z.string(),
        })
      )`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversationId}, ${userId}, ${content})
        RETURNING id, created_at::text
      `);

      // Update conversation timestamp
      await pool.query(sql.type(z.object({}))`
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = ${conversationId}
      `);

      // Create notification for other participant(s)
      await pool.query(sql.type(z.object({}))`
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        SELECT
          cp.user_id,
          'message',
          'New message',
          ${content.substring(0, 100)},
          ${`/messages/${conversationId}`},
          ${JSON.stringify({ conversationId, senderId: userId })}
        FROM conversation_participants cp
        WHERE cp.conversation_id = ${conversationId}
          AND cp.user_id != ${userId}
      `);

      return { messageId: message.id, createdAt: message.created_at };
    }),

  /**
   * Get a specific conversation (for direct linking)
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { conversationId } = input;

      // Verify user is a participant
      const participant = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        SELECT id
        FROM conversation_participants
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a participant in this conversation',
        });
      }

      const conversation = await pool.maybeOne(sql.type(conversationSchema)`
        SELECT
          c.id,
          c.listing_id,
          c.updated_at::text,
          other_user.id as other_user_id,
          other_user.username as other_user_name,
          (
            SELECT content
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message,
          0 as unread_count
        FROM conversations c
        INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
        INNER JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id
        INNER JOIN users other_user ON other_user.id = other_cp.user_id
        WHERE c.id = ${conversationId}
          AND cp.user_id = ${userId}
          AND other_cp.user_id != ${userId}
        LIMIT 1
      `);

      return conversation;
    }),

  /**
   * Mark a conversation as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { conversationId } = input;

      // Verify user is a participant
      const participant = await pool.maybeOne(sql.type(
        z.object({
          id: z.string(),
        })
      )`
        SELECT id
        FROM conversation_participants
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a participant in this conversation',
        });
      }

      // Update last_read_at to mark all messages as read
      await pool.query(sql.type(z.object({}))`
        UPDATE conversation_participants
        SET last_read_at = NOW()
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      return { success: true };
    }),
});
