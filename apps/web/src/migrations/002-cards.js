export const up = async (client) => {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- 1. Sets Table
    CREATE TABLE card_sets (
        code          TEXT PRIMARY KEY,  -- 'drc', 'lea'
        name          TEXT NOT NULL,     -- 'Aetherdrift Commander'
        set_type      TEXT,              -- 'commander', 'expansion', 'core'
        released_at   DATE
    );

    -- 2. Colors Table (Fixed enumeration)
    CREATE TABLE colors (
        id   CHAR(1) PRIMARY KEY,
        name TEXT NOT NULL
    );
    INSERT INTO colors (id, name) VALUES 
      ('W', 'White'), ('U', 'Blue'), ('B', 'Black'), 
      ('R', 'Red'), ('G', 'Green'), ('C', 'Colorless');

    -- 3. Card Designs (The card's rules text and identity - never changes)
    CREATE TABLE card_designs (
        oracle_id      uuid PRIMARY KEY,
        name           TEXT NOT NULL,
        mana_cost      TEXT,
        type_line      TEXT,
        oracle_text    TEXT,
        cmc            DECIMAL(10, 1),
        reserved       BOOLEAN DEFAULT FALSE,
        keywords       TEXT[]  -- Array of keywords like ['Flying', 'Landfall']
    );

    -- 4. Design -> Colors (Many-to-Many, colors are fixed per design)
    CREATE TABLE card_design_colors (
        design_id uuid REFERENCES card_designs(oracle_id) ON DELETE CASCADE,
        color_id  CHAR(1) REFERENCES colors(id),
        PRIMARY KEY (design_id, color_id)
    );

    -- 5. Card Printings (The specific physical card in a set)
    CREATE TABLE card_printings (
        id                uuid PRIMARY KEY,
        design_id         uuid REFERENCES card_designs(oracle_id) ON DELETE CASCADE,
        set_code          TEXT REFERENCES card_sets(code),
        collector_number  TEXT NOT NULL,
        rarity            TEXT NOT NULL, -- 'common', 'uncommon', 'rare', 'mythic'
        image_uri_normal  TEXT,
        price_usd         DECIMAL(12, 2),
        artist            TEXT,
        flavor_text       TEXT,
        frame             TEXT,           -- '2015', '2003', 'future'
        border_color      TEXT,           -- 'black', 'white', 'borderless', etc
        is_foil_available BOOLEAN DEFAULT TRUE,
        is_nonfoil_available BOOLEAN DEFAULT TRUE
    );

    -- 6. Card Faces (For multi-faced cards: transform, modal DFC, split, etc)
    CREATE TABLE card_faces (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        printing_id  uuid REFERENCES card_printings(id) ON DELETE CASCADE,
        face_number  INT,  -- 0, 1, 2... for ordering
        name         TEXT NOT NULL,
        mana_cost    TEXT,
        type_line    TEXT,
        oracle_text  TEXT,
        power        TEXT,
        toughness    TEXT,
        loyalty      TEXT,
        image_uris   JSONB  -- Store the full image_uris object
    );

    -- Indexes for performance
    CREATE INDEX idx_card_designs_name_tgrm ON card_designs USING gin (name gin_trgm_ops);
    CREATE INDEX idx_card_designs_keywords ON card_designs USING gin (keywords);
    CREATE INDEX idx_card_printings_set_code ON card_printings(set_code);
    CREATE INDEX idx_card_printings_design ON card_printings(design_id);
    CREATE INDEX idx_card_printings_rarity ON card_printings(rarity);
    CREATE INDEX idx_card_faces_printing ON card_faces(printing_id);
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS card_faces CASCADE;
    DROP TABLE IF EXISTS card_printings CASCADE;
    DROP TABLE IF EXISTS card_design_colors CASCADE;
    DROP TABLE IF EXISTS card_designs CASCADE;
    DROP TABLE IF EXISTS card_sets CASCADE;
    DROP TABLE IF EXISTS colors CASCADE;
  `);
};
