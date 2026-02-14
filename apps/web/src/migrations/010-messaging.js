export async function up(client) {
  await client.query(`
    -- Conversations table (1-on-1 conversations between users)
    CREATE TABLE conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Optional context: linked to a specific listing
      listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,

      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Conversation participants (many-to-many: users <-> conversations)
    CREATE TABLE conversation_participants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      -- When user joined and last read the conversation
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      -- Ensure each user appears only once per conversation
      UNIQUE(conversation_id, user_id)
    );

    -- Messages table
    CREATE TABLE messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      -- Message content
      content TEXT NOT NULL,

      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      edited_at TIMESTAMP WITH TIME ZONE,

      -- Soft delete (keep for history)
      deleted BOOLEAN DEFAULT FALSE
    );

    -- Indexes for conversations
    CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
    CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

    -- Indexes for conversation_participants
    CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
    CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);

    -- Indexes for messages
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
    CREATE INDEX idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
  `);
}

export async function down(client) {
  await client.query(`
    -- Drop message indexes
    DROP INDEX IF EXISTS idx_messages_created_at;
    DROP INDEX IF EXISTS idx_messages_sender_id;
    DROP INDEX IF EXISTS idx_messages_conversation_id;

    -- Drop conversation_participants indexes
    DROP INDEX IF EXISTS idx_conversation_participants_conversation;
    DROP INDEX IF EXISTS idx_conversation_participants_user;

    -- Drop conversation indexes
    DROP INDEX IF EXISTS idx_conversations_updated_at;
    DROP INDEX IF EXISTS idx_conversations_listing_id;

    -- Drop tables (in reverse dependency order)
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversation_participants;
    DROP TABLE IF EXISTS conversations;
  `);
}
