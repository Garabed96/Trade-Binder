import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../apps/web/.env') });
import { createPool, sql } from 'slonik';
import fs from 'node:fs';
import path from 'node:path';

// TODO: This needs to be refactored (GN)

// Type definitions for Scryfall API responses
// interface ScryfallBulkData {
//   data: Array<{
//     type: string;
//     name: string;
//     download_uri: string;
//     size: number;
//   }>;
// }

// interface ScryfallCardFace {
//   name?: string;
//   mana_cost?: string;
//   type_line?: string;
//   oracle_text?: string;
//   power?: string;
//   toughness?: string;
//   loyalty?: string;
//   colors?: string[];
//   image_uris?: Record<string, string>;
// }

// interface ScryfallCard {
//   id: string;
//   oracle_id?: string;
//   name?: string;
//   set?: string;
//   set_name?: string;
//   set_type?: string;
//   released_at?: string;
//   mana_cost?: string;
//   type_line?: string;
//   oracle_text?: string;
//   cmc?: number;
//   reserved?: boolean;
//   keywords?: string[];
//   colors?: string[];
//   collector_number?: string;
//   rarity?: string;
//   image_uris?: {
//     normal?: string;
//     [key: string]: string | undefined;
//   };
//   prices?: {
//     usd?: string;
//     [key: string]: string | undefined;
//   };
//   artist?: string;
//   flavor_text?: string;
//   frame?: string;
//   border_color?: string;
//   finishes?: string[];
//   card_faces?: ScryfallCardFace[];
// }

interface SetData {
  code: string;
  name: string;
  set_type: string | null;
  released_at: string | null;
}

interface DesignData {
  oracle_id: string;
  name: string;
  mana_cost: string | null;
  type_line: string | null;
  oracle_text: string | null;
  cmc: number;
  reserved: boolean;
  keywords: string[];
}

interface PrintingData {
  id: string;
  design_id: string;
  set_code: string;
  collector_number: string;
  rarity: string;
  image_uri_normal: string | null;
  price_usd: number | null;
  artist: string | null;
  flavor_text: string | null;
  frame: string | null;
  border_color: string | null;
  is_foil_available: boolean;
  is_nonfoil_available: boolean;
}

interface FaceData {
  printing_id: string;
  face_number: number;
  name: string;
  mana_cost: string | null;
  type_line: string | null;
  oracle_text: string | null;
  power: string | null;
  toughness: string | null;
  loyalty: string | null;
  image_uris: string | null;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = await createPool(DATABASE_URL);

const CACHE_FILE = path.join(process.cwd(), '.cache', 'scryfall-cards.json');
const CACHE_DURATION_MS = 60 * 60 * 60 * 1000; // 60 hours

async function getCachedOrFetchCards() {
  // Check if the cache exists and is fresh
  if (fs.existsSync(CACHE_FILE)) {
    const stats = fs.statSync(CACHE_FILE);
    const ageMs = Date.now() - stats.mtimeMs;

    if (ageMs < CACHE_DURATION_MS) {
      const minutesOld = Math.floor(ageMs / 1000 / 60);
      console.log(`📦 Using cached data (${minutesOld} minutes old)`);
      console.log(
        `   Cache expires in ${Math.ceil((CACHE_DURATION_MS - ageMs) / 1000 / 60)} minutes\n`,
      );

      const cached = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(cached);
    } else {
      console.log('⏰ Cache expired, fetching fresh data...\n');
    }
  } else {
    console.log('🌐 No cache found, downloading from Scryfall...\n');
  }

  // Fetch fresh data
  console.log('Fetching bulk data list from Scryfall API...');
  const bulkDataResponse = await fetch('https://api.scryfall.com/bulk-data');
  const bulkData = await bulkDataResponse.json();
  const defaultCards = bulkData.data.find((d: { type: string }) => d.type === 'default_cards');

  if (!defaultCards) {
    throw new Error('Could not find default_cards bulk data');
  }

  console.log(`Downloading "${defaultCards.name}"...`);
  console.log(`Size: ${(defaultCards.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('This may take a few minutes...\n');

  const dataResponse = await fetch(defaultCards.download_uri);
  const cards = await dataResponse.json();

  // Save to cache
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  console.log('💾 Saving to cache...');
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cards));
  console.log(`✓ Cached for next 30 minutes\n`);

  return cards;
}

async function importCards() {
  try {
    const cards = await getCachedOrFetchCards();

    console.log(`Found ${cards.length} card objects. Processing...\n`);

    // Step 1: Collect unique Sets, Designs, and Colors
    const setsMap = new Map<string, SetData>();
    const designsMap = new Map<string, DesignData>();
    const colorsMap = new Map<string, string[]>();
    const printingsArray: PrintingData[] = [];
    const facesArray: FaceData[] = [];

    for (const card of cards) {
      if (!card.oracle_id || !card.id) continue;

      // 1. Track Sets
      if (card.set && card.set_name && !setsMap.has(card.set)) {
        setsMap.set(card.set, {
          code: card.set,
          name: card.set_name,
          set_type: card.set_type || null,
          released_at: card.released_at || null,
        });
      }

      // 2. Track Designs
      if (!designsMap.has(card.oracle_id)) {
        let colors = card.colors || [];
        if (!card.colors && card.card_faces) {
          colors = Array.from(
            new Set(card.card_faces.flatMap((f: { colors: string[] }) => f.colors || [])),
          );
        }

        designsMap.set(card.oracle_id, {
          oracle_id: card.oracle_id,
          name: card.name || '',
          mana_cost: card.mana_cost || null,
          type_line: card.type_line || null,
          oracle_text: card.oracle_text || null,
          cmc: card.cmc ?? 0,
          reserved: card.reserved || false,
          keywords: Array.isArray(card.keywords) ? card.keywords : [],
        });

        colorsMap.set(card.oracle_id, colors);
      }

      // 3. Track Printings
      printingsArray.push({
        id: card.id,
        design_id: card.oracle_id,
        set_code: card.set || '',
        collector_number: card.collector_number || '',
        rarity: card.rarity || 'common',
        image_uri_normal: card.image_uris?.normal || null,
        price_usd: card.prices?.usd ? parseFloat(card.prices.usd) : null,
        artist: card.artist || null,
        flavor_text: card.flavor_text || null,
        frame: card.frame || null,
        border_color: card.border_color || null,
        is_foil_available: card.finishes?.includes('foil') ?? true,
        is_nonfoil_available: card.finishes?.includes('nonfoil') ?? true,
      });

      // 4. Track Card Faces
      if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face: FaceData, index: number) => {
          facesArray.push({
            printing_id: card.id,
            face_number: index,
            name: face.name || '',
            mana_cost: face.mana_cost || null,
            type_line: face.type_line || null,
            oracle_text: face.oracle_text || null,
            power: face.power || null,
            toughness: face.toughness || null,
            loyalty: face.loyalty || null,
            image_uris: face.image_uris ? JSON.stringify(face.image_uris) : null,
          });
        });
      } else {
        facesArray.push({
          printing_id: card.id,
          face_number: 0,
          name: card.name || '',
          mana_cost: card.mana_cost || null,
          type_line: card.type_line || null,
          oracle_text: card.oracle_text || null,
          power: card.power || null,
          toughness: card.toughness || null,
          loyalty: card.loyalty || null,
          image_uris: card.image_uris ? JSON.stringify(card.image_uris) : null,
        });
      }
    }

    console.log(`Processed ${setsMap.size} unique sets`);
    console.log(`Processed ${designsMap.size} unique card designs`);
    console.log(`Processed ${printingsArray.length} card printings`);
    console.log(`Processed ${facesArray.length} card faces\n`);

    // Step 2: Insert Sets
    console.log('Inserting sets...');
    const setsForDb = Array.from(setsMap.values()).map((s) => [
      s.code,
      s.name,
      s.set_type,
      s.released_at,
    ]);

    if (setsForDb.length > 0) {
      await pool.query(sql.unsafe`
        INSERT INTO card_sets (code, name, set_type, released_at)
        SELECT *
        FROM ${sql.unnest(setsForDb, ['text', 'text', 'text', 'date'])} ON CONFLICT (code) DO NOTHING
      `);
    }
    console.log('✓ Sets inserted\n');

    // Step 3: Insert Card Designs
    console.log('Inserting card designs...');

    // Debug: Check a few keyword values
    const sampleDesigns = Array.from(designsMap.values()).slice(0, 5);
    console.log(
      'Sample keywords:',
      sampleDesigns.map((d) => ({
        name: d.name,
        keywords: d.keywords,
        type: typeof d.keywords,
        isArray: Array.isArray(d.keywords),
      })),
    );

    // Helper function to format JS array as PostgreSQL array literal
    const formatPgArray = (arr: string[]) => {
      if (!arr || arr.length === 0) return '{}';
      // Escape quotes and backslashes in each element, then wrap in quotes
      const escaped = arr.map(
        (item) => '"' + item.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"',
      );
      return '{' + escaped.join(',') + '}';
    };

    const designsForDb = Array.from(designsMap.values()).map((d) => [
      d.oracle_id,
      d.name,
      d.mana_cost,
      d.type_line,
      d.oracle_text,
      d.cmc,
      d.reserved,
      formatPgArray(d.keywords || []), // Convert JS array to PG array literal string
    ]);

    await pool.query(sql.unsafe`
      INSERT INTO card_designs (
        oracle_id, name, mana_cost, type_line, oracle_text, cmc, reserved, keywords
      )
      SELECT
        t.oracle_id,
        t.name,
        t.mana_cost,
        t.type_line,
        t.oracle_text,
        t.cmc,
        t.reserved,
        t.keywords::text[] -- Explicitly cast the text to text[]
      FROM ${sql.unnest(designsForDb, [
        'uuid',
        'text',
        'text',
        'text',
        'text',
        'numeric',
        'bool',
        'text',
      ])} AS t(oracle_id, name, mana_cost, type_line, oracle_text, cmc, reserved, keywords)
        ON CONFLICT (oracle_id) DO NOTHING
    `);

    console.log('✓ Card designs inserted\n');

    // Step 4: Insert Design Colors
    console.log('Inserting design colors...');
    const designColorsArray: Array<[string, string]> = [];
    for (const [designId, colors] of colorsMap.entries()) {
      for (const color of colors) {
        designColorsArray.push([designId, color]);
      }
    }

    if (designColorsArray.length > 0) {
      const batchSize = 10000;
      for (let i = 0; i < designColorsArray.length; i += batchSize) {
        const batch = designColorsArray.slice(i, i + batchSize);
        await pool.query(sql.unsafe`
          INSERT INTO card_design_colors (design_id, color_id)
          SELECT *
          FROM ${sql.unnest(batch, ['uuid', 'text'])} ON CONFLICT (design_id, color_id) DO NOTHING
        `);
      }
    }
    console.log('✓ Design colors inserted\n');

    // Step 5: Insert Card Printings
    console.log('Inserting card printings...');
    const printBatchSize = 5000;
    for (let i = 0; i < printingsArray.length; i += printBatchSize) {
      const batch = printingsArray.slice(i, i + printBatchSize);
      const batchForDb = batch.map((p) => [
        p.id,
        p.design_id,
        p.set_code,
        p.collector_number,
        p.rarity,
        p.image_uri_normal,
        p.price_usd,
        p.artist,
        p.flavor_text,
        p.frame,
        p.border_color,
        p.is_foil_available,
        p.is_nonfoil_available,
      ]);

      await pool.query(sql.unsafe`
        INSERT INTO card_printings (id, design_id, set_code, collector_number, rarity,
                                    image_uri_normal, price_usd, artist, flavor_text,
                                    frame, border_color, is_foil_available, is_nonfoil_available)
        SELECT *
        FROM ${sql.unnest(batchForDb, [
          'uuid',
          'uuid',
          'text',
          'text',
          'text',
          'text',
          'numeric',
          'text',
          'text',
          'text',
          'text',
          'bool',
          'bool',
        ])} ON CONFLICT (id) DO NOTHING
      `);

      const progress = (((i + batch.length) / printingsArray.length) * 100).toFixed(1);
      console.log(`  Progress: ${i + batch.length} / ${printingsArray.length} (${progress}%)`);
    }
    console.log('✓ Card printings inserted\n');

    // Step 6: Insert Card Faces
    console.log('Inserting card faces...');
    const facesBatchSize = 5000;
    for (let i = 0; i < facesArray.length; i += facesBatchSize) {
      const batch = facesArray.slice(i, i + facesBatchSize);
      const batchForDb = batch.map((f) => [
        f.printing_id,
        f.face_number,
        f.name,
        f.mana_cost,
        f.type_line,
        f.oracle_text,
        f.power,
        f.toughness,
        f.loyalty,
        f.image_uris,
      ]);

      await pool.query(sql.unsafe`
        INSERT INTO card_faces (printing_id, face_number, name, mana_cost, type_line,
                                oracle_text, power, toughness, loyalty, image_uris)
        SELECT *
        FROM ${sql.unnest(batchForDb, [
          'uuid',
          'int4',
          'text',
          'text',
          'text',
          'text',
          'text',
          'text',
          'text',
          'jsonb',
        ])}
      `);

      const progress = (((i + batch.length) / facesArray.length) * 100).toFixed(1);
      console.log(`  Progress: ${i + batch.length} / ${facesArray.length} (${progress}%)`);
    }
    console.log('✓ Card faces inserted\n');

    console.log('✅ Import complete!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

importCards();
