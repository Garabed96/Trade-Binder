# Messaging & Notification System Design

**Project:** Trade Binder
**Version:** 1.0
**Date:** 2026-02-14
**Status:** Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Design (tRPC)](#api-design-trpc)
5. [Real-time Communication](#real-time-communication)
6. [UI/UX Components](#uiux-components)
7. [E2E Testing with Playwright](#e2e-testing-with-playwright)
8. [Implementation Phases](#implementation-phases)
9. [Security & Privacy](#security--privacy)
10. [Performance Considerations](#performance-considerations)

---

## Overview

### Goals

- Enable direct messaging between buyers and sellers
- Provide real-time notifications for marketplace events
- Create a seamless user experience for trade negotiations
- Maintain data integrity and user privacy

### Key Features

#### Notifications

- **In-app notifications** for:
  - New messages
  - Trade offers received/accepted/rejected
  - Listing sold/purchased
  - Price alerts (future)
  - Binder updates (future)
- **Notification types**: info, success, warning, error
- **Read/unread status tracking**
- **Notification preferences** (future)

#### Messaging

- **Direct 1-on-1 messaging** between users
- **Context-aware conversations** (linked to listings)
- **Message history** with pagination
- **Typing indicators** (Phase 2)
- **Read receipts** (Phase 2)
- **Message attachments** (future - images, trade proposals)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Notification │  │   Messages   │  │  Real-time   │      │
│  │     UI       │  │      UI      │  │   Updates    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ tRPC API Calls
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      tRPC Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Notification   │  │    Message       │                │
│  │     Router       │  │     Router       │                │
│  └──────────────────┘  └──────────────────┘                │
│         │                        │                          │
│         └────────────────────────┘                          │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ Slonik SQL Queries
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                PostgreSQL Database                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │notifications│  │ conversations│  │   messages   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 19, Next.js 16, TailwindCSS
- **API**: tRPC v11 (type-safe API)
- **Database**: PostgreSQL 16+ with Slonik
- **Real-time**: tRPC WebSocket subscriptions (Phase 2) or polling (Phase 1)
- **Auth**: NextAuth v4
- **Testing**: Playwright, Vitest

---

## Database Schema

### Tables

#### 1. `notifications` Table

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'message', 'trade_offer', 'listing_sold', 'price_alert'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500), -- Optional link to related resource
  metadata JSONB, -- Flexible data (e.g., sender_id, listing_id, offer_id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_created_at (created_at DESC),
  INDEX idx_notifications_unread (user_id, read) WHERE read = FALSE
);
```

#### 2. `conversations` Table

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL, -- Optional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- Last message timestamp

  INDEX idx_conversations_listing_id (listing_id),
  INDEX idx_conversations_updated_at (updated_at DESC)
);
```

#### 3. `conversation_participants` Table

```sql
CREATE TABLE conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(conversation_id, user_id),
  INDEX idx_conversation_participants_user (user_id),
  INDEX idx_conversation_participants_conversation (conversation_id)
);
```

#### 4. `messages` Table

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT FALSE,

  INDEX idx_messages_conversation_id (conversation_id, created_at DESC),
  INDEX idx_messages_sender_id (sender_id)
);
```

### Migration Files

**File**: `apps/web/src/migrations/004_create_notifications.js`

```javascript
export async function up(client) {
  await client.query(`
    CREATE TABLE notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      link VARCHAR(500),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ
    );

    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
  `);
}

export async function down(client) {
  await client.query(`DROP TABLE IF EXISTS notifications CASCADE;`);
}
```

**File**: `apps/web/src/migrations/005_create_messaging.js`

```javascript
export async function up(client) {
  await client.query(`
    CREATE TABLE conversations (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE conversation_participants (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      last_read_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      edited_at TIMESTAMPTZ,
      deleted BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
    CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
    CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
    CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
    CREATE INDEX idx_messages_sender_id ON messages(sender_id);
  `);
}

export async function down(client) {
  await client.query(`
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS conversation_participants CASCADE;
    DROP TABLE IF EXISTS conversations CASCADE;
  `);
}
```

---

## API Design (tRPC)

### Notification Router

**File**: `apps/web/src/server/routers/notification.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { sql } from 'slonik';

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
      const { userId } = ctx.session.user;
      const { limit, offset, unreadOnly } = input;

      const notifications = await ctx.db.query(sql.type(
        z.object({
          id: z.number(),
          type: z.string(),
          title: z.string(),
          message: z.string(),
          read: z.boolean(),
          link: z.string().nullable(),
          metadata: z.any(),
          createdAt: z.date(),
          readAt: z.date().nullable(),
        })
      )`
        SELECT
          id, type, title, message, read, link, metadata,
          created_at as "createdAt",
          read_at as "readAt"
        FROM notifications
        WHERE user_id = ${userId}
          ${unreadOnly ? sql.fragment`AND read = FALSE` : sql.fragment``}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      return notifications.rows;
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session.user;

    const result = await ctx.db.one(sql.type(
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session.user;

      await ctx.db.query(sql.unsafe`
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
    const { userId } = ctx.session.user;

    await ctx.db.query(sql.unsafe`
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session.user;

      await ctx.db.query(sql.unsafe`
        DELETE FROM notifications
        WHERE id = ${input.id} AND user_id = ${userId}
      `);

      return { success: true };
    }),
});
```

### Message Router

**File**: `apps/web/src/server/routers/message.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { sql } from 'slonik';
import { TRPCError } from '@trpc/server';

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
      const { userId } = ctx.session.user;
      const { limit, offset } = input;

      const conversations = await ctx.db.query(sql.type(
        z.object({
          id: z.number(),
          listingId: z.number().nullable(),
          updatedAt: z.date(),
          otherUserId: z.number(),
          otherUserName: z.string(),
          lastMessage: z.string().nullable(),
          unreadCount: z.number(),
        })
      )`
        SELECT
          c.id,
          c.listing_id as "listingId",
          c.updated_at as "updatedAt",
          other_user.id as "otherUserId",
          other_user.username as "otherUserName",
          (
            SELECT content
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as "lastMessage",
          (
            SELECT COUNT(*)::int
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.created_at > cp.last_read_at
              AND m.sender_id != ${userId}
          ) as "unreadCount"
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

      return conversations.rows;
    }),

  /**
   * Get messages for a specific conversation
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session.user;
      const { conversationId, limit, offset } = input;

      // Verify user is a participant
      const participant = await ctx.db.maybeOne(sql.type(
        z.object({
          id: z.number(),
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

      const messages = await ctx.db.query(sql.type(
        z.object({
          id: z.number(),
          senderId: z.number(),
          senderName: z.string(),
          content: z.string(),
          createdAt: z.date(),
          editedAt: z.date().nullable(),
          deleted: z.boolean(),
        })
      )`
        SELECT
          m.id,
          m.sender_id as "senderId",
          u.username as "senderName",
          m.content,
          m.created_at as "createdAt",
          m.edited_at as "editedAt",
          m.deleted
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      // Update last_read_at
      await ctx.db.query(sql.unsafe`
        UPDATE conversation_participants
        SET last_read_at = NOW()
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
      `);

      return messages.rows.reverse(); // Oldest to newest
    }),

  /**
   * Start a new conversation
   */
  startConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.number(),
        listingId: z.number().optional(),
        initialMessage: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session.user;
      const { otherUserId, listingId, initialMessage } = input;

      // Check if conversation already exists
      const existing = await ctx.db.maybeOne(sql.type(
        z.object({
          id: z.number(),
        })
      )`
        SELECT c.id
        FROM conversations c
        INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
        INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
        WHERE cp1.user_id = ${userId}
          AND cp2.user_id = ${otherUserId}
          ${listingId ? sql.fragment`AND c.listing_id = ${listingId}` : sql.fragment``}
        LIMIT 1
      `);

      if (existing) {
        // Add message to existing conversation
        await ctx.db.query(sql.unsafe`
          INSERT INTO messages (conversation_id, sender_id, content)
          VALUES (${existing.id}, ${userId}, ${initialMessage})
        `);

        await ctx.db.query(sql.unsafe`
          UPDATE conversations
          SET updated_at = NOW()
          WHERE id = ${existing.id}
        `);

        return { conversationId: existing.id };
      }

      // Create new conversation
      const conversation = await ctx.db.one(sql.type(
        z.object({
          id: z.number(),
        })
      )`
        INSERT INTO conversations (listing_id)
        VALUES (${listingId ?? null})
        RETURNING id
      `);

      // Add participants
      await ctx.db.query(sql.unsafe`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES
          (${conversation.id}, ${userId}),
          (${conversation.id}, ${otherUserId})
      `);

      // Add initial message
      await ctx.db.query(sql.unsafe`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversation.id}, ${userId}, ${initialMessage})
      `);

      // Create notification for other user
      await ctx.db.query(sql.unsafe`
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
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session.user;
      const { conversationId, content } = input;

      // Verify user is a participant
      const participant = await ctx.db.maybeOne(sql.type(
        z.object({
          id: z.number(),
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
      const message = await ctx.db.one(sql.type(
        z.object({
          id: z.number(),
          createdAt: z.date(),
        })
      )`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversationId}, ${userId}, ${content})
        RETURNING id, created_at as "createdAt"
      `);

      // Update conversation timestamp
      await ctx.db.query(sql.unsafe`
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = ${conversationId}
      `);

      // Create notification for other participant(s)
      await ctx.db.query(sql.unsafe`
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

      return { messageId: message.id, createdAt: message.createdAt };
    }),
});
```

### Update Root Router

**File**: `apps/web/src/server/routers/_app.ts`

```typescript
import { router } from '../trpc';
import { cardRouter } from './card';
import { binderRouter } from './binder';
import { inventoryRouter } from './inventory';
import { marketplaceRouter } from './marketplace';
import { profileRouter } from './profile';
import { userRouter } from './user';
import { notificationRouter } from './notification'; // Add this
import { messageRouter } from './message'; // Add this

export const appRouter = router({
  card: cardRouter,
  binder: binderRouter,
  inventory: inventoryRouter,
  marketplace: marketplaceRouter,
  profile: profileRouter,
  user: userRouter,
  notification: notificationRouter, // Add this
  message: messageRouter, // Add this
});

export type AppRouter = typeof appRouter;
```

---

## Real-time Communication

### Phase 1: Polling (MVP)

Simple client-side polling for immediate implementation.

**Client-side polling hook**:

```typescript
// apps/web/src/hooks/useNotificationPolling.ts
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function useNotificationPolling(interval = 30000) {
  const utils = trpc.useUtils();

  useEffect(() => {
    const pollInterval = setInterval(() => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    }, interval);

    return () => clearInterval(pollInterval);
  }, [interval, utils]);
}
```

### Phase 2: WebSocket Subscriptions (Future)

Using tRPC WebSocket subscriptions for real-time updates.

**Server-side subscription**:

```typescript
// apps/web/src/server/routers/notification.ts (extended)
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

export const notificationRouter = router({
  // ... existing procedures

  /**
   * Subscribe to new notifications
   */
  onNew: protectedProcedure.subscription(({ ctx }) => {
    return observable(emit => {
      const onNotification = (data: any) => {
        if (data.userId === ctx.session.user.userId) {
          emit.next(data.notification);
        }
      };

      eventEmitter.on('new-notification', onNotification);

      return () => {
        eventEmitter.off('new-notification', onNotification);
      };
    });
  }),
});

// Helper to emit new notifications
export function emitNotification(userId: number, notification: any) {
  eventEmitter.emit('new-notification', { userId, notification });
}
```

---

## UI/UX Components

### 1. Notification Bell

**Location**: Navbar (top-right)
**File**: `apps/web/src/components/NotificationBell.tsx`

```typescript
'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { NotificationDropdown } from './NotificationDropdown';
import { useState } from 'react';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <NotificationDropdown onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
```

### 2. Notification Dropdown

**File**: `apps/web/src/components/NotificationDropdown.tsx`

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notification.getAll.useQuery({
    limit: 20,
    unreadOnly: false,
  });

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  return (
    <div className="absolute right-0 mt-2 w-96 rounded-lg border bg-white shadow-lg dark:bg-gray-800">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
          >
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => {
                        if (!notification.read) {
                          markAsReadMutation.mutate({ id: notification.id });
                        }
                        onClose();
                      }}
                    >
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  ) : (
                    <>
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ id: notification.id })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 3. Messages Page

**File**: `apps/web/src/app/messages/page.tsx`

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { useState } from 'react';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  return (
    <div className="flex h-screen">
      {/* Sidebar: Conversation List */}
      <div className="w-1/3 border-r">
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Main: Message Thread */}
      <div className="flex-1">
        {selectedConversationId ? (
          <MessageThread conversationId={selectedConversationId} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. Conversation List Component

**File**: `apps/web/src/components/ConversationList.tsx`

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const { data: conversations = [] } = trpc.message.getConversations.useQuery({
    limit: 50,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>

      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={`cursor-pointer border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
            selectedId === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{conversation.otherUserName}</h3>
                {conversation.unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {conversation.lastMessage || 'No messages yet'}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(conversation.updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}

      {conversations.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No conversations yet
        </div>
      )}
    </div>
  );
}
```

### 5. Message Thread Component

**File**: `apps/web/src/components/MessageThread.tsx`

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  conversationId: number;
}

export function MessageThread({ conversationId }: Props) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.message.getMessages.useQuery(
    { conversationId, limit: 50 },
    { refetchInterval: 5000 } // Poll every 5 seconds
  );

  const sendMessageMutation = trpc.message.sendMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      utils.message.getMessages.invalidate({ conversationId });
      utils.message.getConversations.invalidate();
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate({
        conversationId,
        content: message.trim(),
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${
              msg.senderId === 'current-user-id' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-md rounded-lg p-3 ${
                msg.senderId === 'current-user-id'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="mt-1 text-xs opacity-70">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border p-2 dark:bg-gray-800"
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## E2E Testing with Playwright

### Test Structure

```
apps/web/e2e/
├── fixtures/
│   └── auth.ts              # Authentication helpers
├── notifications/
│   ├── bell.spec.ts         # Notification bell tests
│   ├── dropdown.spec.ts     # Notification dropdown tests
│   └── interactions.spec.ts # Mark read/delete tests
├── messaging/
│   ├── conversations.spec.ts # Conversation list tests
│   ├── send-message.spec.ts  # Send/receive message tests
│   └── thread.spec.ts        # Message thread tests
└── integration/
    └── notification-from-message.spec.ts # End-to-end flow
```

### Example Test: Notification Bell

**File**: `apps/web/e2e/notifications/bell.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Notification Bell', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display unread count badge', async ({ page }) => {
    // Wait for notification bell
    const bell = page.locator('[data-testid="notification-bell"]');
    await expect(bell).toBeVisible();

    // Check for badge with count
    const badge = bell.locator('.absolute');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/\d+/);
  });

  test('should open dropdown on click', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();
  });

  test('should display notifications in dropdown', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    // Wait for notifications to load
    const notifications = page.locator('[data-testid^="notification-"]');
    await expect(notifications).not.toHaveCount(0);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/notification-dropdown.png' });
  });
});
```

### Example Test: Send Message

**File**: `apps/web/e2e/messaging/send-message.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Messaging', () => {
  test('should send a message successfully', async ({ page }) => {
    // Login and navigate to messages
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.goto('/messages');

    // Select a conversation
    const conversation = page.locator('[data-testid^="conversation-"]').first();
    await conversation.click();

    // Type and send message
    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Hello, this is a test message!');
    await page.click('button[data-testid="send-message"]');

    // Verify message appears in thread
    await expect(
      page.locator('text=Hello, this is a test message!')
    ).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/message-sent.png' });
  });

  test('should receive notification when message sent', async ({ browser }) => {
    // Create two contexts for two users
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    // User 1 logs in
    await user1Page.goto('/login');
    await user1Page.fill('input[name="email"]', 'user1@example.com');
    await user1Page.fill('input[name="password"]', 'password');
    await user1Page.click('button[type="submit"]');

    // User 2 logs in
    await user2Page.goto('/login');
    await user2Page.fill('input[name="email"]', 'user2@example.com');
    await user2Page.fill('input[name="password"]', 'password');
    await user2Page.click('button[type="submit"]');

    // User 1 sends a message to User 2
    await user1Page.goto('/messages');
    const conversation = user1Page
      .locator('[data-testid^="conversation-"]')
      .first();
    await conversation.click();
    await user1Page.fill(
      'input[placeholder="Type a message..."]',
      'Test notification'
    );
    await user1Page.click('button[data-testid="send-message"]');

    // Wait a bit for notification to arrive
    await user2Page.waitForTimeout(2000);

    // User 2 should see notification badge
    const badge = user2Page.locator(
      '[data-testid="notification-bell"] .absolute'
    );
    await expect(badge).toBeVisible();

    // Clean up
    await user1Context.close();
    await user2Context.close();
  });
});
```

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug
```

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-2)

**Goal**: Basic notifications and messaging with polling

- [ ] Database migrations
  - [ ] Create `notifications` table
  - [ ] Create `conversations`, `conversation_participants`, `messages` tables
- [ ] tRPC API implementation
  - [ ] Notification router (getAll, getUnreadCount, markAsRead, delete)
  - [ ] Message router (getConversations, getMessages, startConversation, sendMessage)
- [ ] UI Components
  - [ ] NotificationBell with badge
  - [ ] NotificationDropdown
  - [ ] Messages page layout
  - [ ] ConversationList
  - [ ] MessageThread with input
- [ ] Polling mechanism
  - [ ] Client-side polling every 30s for notifications
  - [ ] Client-side polling every 5s for messages (when thread open)
- [ ] Playwright E2E tests
  - [ ] Notification tests
  - [ ] Messaging tests
- [ ] Git: Commit and push to `claude/system-design-architecture-3Iehy`

### Phase 2: Real-time Updates (Weeks 3-4)

**Goal**: WebSocket subscriptions for instant updates

- [ ] tRPC WebSocket setup
  - [ ] Configure WebSocket transport
  - [ ] Implement subscription procedures
  - [ ] Event emitter for notifications/messages
- [ ] Update UI to use subscriptions
  - [ ] Replace polling with subscriptions
  - [ ] Optimistic updates for sending messages
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Performance optimization
  - [ ] Message pagination with infinite scroll
  - [ ] Notification lazy loading
- [ ] E2E tests for real-time features

### Phase 3: Enhanced Features (Future)

**Goal**: Advanced functionality

- [ ] Message attachments (images, files)
- [ ] Trade proposal integration
  - [ ] Send trade offer in message
  - [ ] Accept/reject inline
- [ ] Search messages
- [ ] Notification preferences
  - [ ] Email notifications
  - [ ] Push notifications (browser API)
  - [ ] Per-category settings
- [ ] Message reactions
- [ ] Block/report users
- [ ] Archive conversations

---

## Security & Privacy

### Authentication & Authorization

- All API routes use `protectedProcedure` (requires authentication)
- Verify user is conversation participant before showing messages
- Prevent unauthorized access to other users' notifications

### Data Validation

- Input validation with Zod schemas
- Sanitize message content (prevent XSS)
- Rate limiting for sending messages (prevent spam)

### Privacy

- Users can only see their own notifications
- Users can only access conversations they're part of
- Message deletion only marks as deleted (soft delete)

### SQL Injection Prevention

- Use Slonik parameterized queries throughout
- Never concatenate user input into SQL strings

---

## Performance Considerations

### Database Indexing

- Index on `user_id` for notifications (fast lookups)
- Index on `created_at` for time-based sorting
- Compound index on `(user_id, read)` for unread queries
- Index on `conversation_id, created_at` for message queries

### Pagination

- Limit query results (max 100 notifications, 50 messages)
- Use offset-based pagination initially
- Consider cursor-based pagination for Phase 2

### Caching (Future)

- Cache unread count in Redis
- Invalidate on new notification
- Cache recent conversations

### Real-time Optimization

- Use WebSocket connection pooling
- Debounce typing indicators
- Batch notification updates

---

## Appendix

### Dependencies to Add

```json
{
  "dependencies": {
    "date-fns": "^2.30.0" // For date formatting
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2" // Already added
  }
}
```

### Database Indexes Summary

```sql
-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Conversations
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Conversation Participants
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

### Environment Variables

No new environment variables required for Phase 1.

### API Endpoints Summary

**Notifications**:

- `notification.getAll` - Get all notifications
- `notification.getUnreadCount` - Get unread count
- `notification.markAsRead` - Mark single as read
- `notification.markAllAsRead` - Mark all as read
- `notification.delete` - Delete notification

**Messages**:

- `message.getConversations` - Get all conversations
- `message.getMessages` - Get messages for conversation
- `message.startConversation` - Start new conversation
- `message.sendMessage` - Send message to conversation

---

**End of Design Document**
