export const up = async (client) => {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE TABLE card_designs (
        oracle_id   uuid PRIMARY KEY,
        name        TEXT NOT NULL,
        mana_cost   TEXT,
        type_line   TEXT,
        oracle_text TEXT,
        cmc         DECIMAL(10, 1)
    );

    CREATE TABLE card_printings (
        id                uuid PRIMARY KEY,
        design_id         uuid REFERENCES card_designs(oracle_id) ON DELETE CASCADE,
        set_code          TEXT NOT NULL,
        set_name          TEXT NOT NULL,
        collector_number  TEXT NOT NULL,
        rarity            TEXT NOT NULL,
        image_uri_normal  TEXT,
        price_usd         DECIMAL(12, 2),
        released_at       DATE
    );

    CREATE INDEX idx_card_designs_name_tgrm ON card_designs USING gin (name gin_trgm_ops);
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS card_printings;
    DROP TABLE IF EXISTS card_designs;
  `);
};
