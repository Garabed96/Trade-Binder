export async function up(client) {
  await client.query(`
    -- Listings table for fixed-price marketplace listings
    CREATE TABLE listings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_card_id uuid NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      -- Pricing (required)
      price DECIMAL(10,2) NOT NULL CHECK (price > 0),

      -- Status
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),

      -- Metadata
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX idx_listings_user_id ON listings(user_id);
    CREATE INDEX idx_listings_status ON listings(status);
    CREATE INDEX idx_listings_user_card_id ON listings(user_card_id);
    CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

    -- Constraint: only one active listing per user_card
    CREATE UNIQUE INDEX idx_unique_active_listing
      ON listings(user_card_id)
      WHERE status = 'active';

    -- Inquiries table (when buyer clicks "Buy")
    CREATE TABLE inquiries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      -- Optional message from buyer
      message TEXT,

      -- Status: pending (awaiting seller action), accepted (seller willing to sell),
      -- declined (seller rejected), completed (transaction finished)
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),

      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes for inquiry queries
    CREATE INDEX idx_inquiries_listing_id ON inquiries(listing_id);
    CREATE INDEX idx_inquiries_buyer_id ON inquiries(buyer_id);
    CREATE INDEX idx_inquiries_seller_id ON inquiries(seller_id);
    CREATE INDEX idx_inquiries_status ON inquiries(status);
    CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);
  `);
}

export async function down(client) {
  await client.query(`
    -- Drop indexes first
    DROP INDEX IF EXISTS idx_inquiries_created_at;
    DROP INDEX IF EXISTS idx_inquiries_status;
    DROP INDEX IF EXISTS idx_inquiries_seller_id;
    DROP INDEX IF EXISTS idx_inquiries_buyer_id;
    DROP INDEX IF EXISTS idx_inquiries_listing_id;

    DROP INDEX IF EXISTS idx_unique_active_listing;
    DROP INDEX IF EXISTS idx_listings_created_at;
    DROP INDEX IF EXISTS idx_listings_user_card_id;
    DROP INDEX IF EXISTS idx_listings_status;
    DROP INDEX IF EXISTS idx_listings_user_id;

    -- Drop tables
    DROP TABLE IF EXISTS inquiries;
    DROP TABLE IF EXISTS listings;
  `);
}
