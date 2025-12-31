export const up = async (client) => {
  await client.query(`
    -- Add type and is_public to binders
    ALTER TABLE binders ADD COLUMN type TEXT DEFAULT 'personal';
    ALTER TABLE binders ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

    -- Add country_code to users
    ALTER TABLE users ADD COLUMN country_code TEXT;

    -- Create user_cards (Master Inventory)
    CREATE TABLE user_cards (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
        printing_id  uuid REFERENCES card_printings(id),
        binder_id    uuid REFERENCES binders(id) ON DELETE SET NULL,
        condition    TEXT,
        is_foil      BOOLEAN DEFAULT FALSE,
        language     TEXT DEFAULT 'en',
        acquired_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes for performance
    CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
    CREATE INDEX idx_user_cards_binder_id ON user_cards(binder_id);
    CREATE INDEX idx_user_cards_printing_id ON user_cards(printing_id);
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS user_cards;
    ALTER TABLE binders DROP COLUMN IF EXISTS type;
    ALTER TABLE binders DROP COLUMN IF EXISTS is_public;
    ALTER TABLE users DROP COLUMN IF EXISTS country_code;
  `);
};
