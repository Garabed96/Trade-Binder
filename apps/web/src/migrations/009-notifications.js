export async function up(client) {
  await client.query(`
    -- Notifications table for in-app notifications
    CREATE TABLE notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      -- Notification type: message, trade_offer, listing_sold, price_alert, etc.
      type VARCHAR(50) NOT NULL,

      -- Content
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,

      -- Read status
      read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP WITH TIME ZONE,

      -- Optional link to related resource
      link VARCHAR(500),

      -- Flexible metadata for additional context
      metadata JSONB,

      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX idx_notifications_type ON notifications(type);

    -- Partial index for unread notifications (most common query)
    CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC)
      WHERE read = FALSE;
  `);
}

export async function down(client) {
  await client.query(`
    -- Drop indexes
    DROP INDEX IF EXISTS idx_notifications_unread;
    DROP INDEX IF EXISTS idx_notifications_type;
    DROP INDEX IF EXISTS idx_notifications_created_at;
    DROP INDEX IF EXISTS idx_notifications_user_id;

    -- Drop table
    DROP TABLE IF EXISTS notifications;
  `);
}
