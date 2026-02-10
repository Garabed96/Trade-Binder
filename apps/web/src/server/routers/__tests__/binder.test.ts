import { Mocked, vi } from 'vitest';
import { binderRouter } from '../binder';

vi.mock('@/src/server/db', () => {
  // Mock sql.type() to return a function that acts as a tagged template
  const mockType = vi.fn(() => {
    return vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      // Add any other properties that slonik sql queries have
      sql: strings.join('?'),
    }));
  });

  const mockSql = Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      sql: strings.join('?'),
    })),
    {
      fragment: vi.fn((...args: unknown[]) => args),
      join: vi.fn((fragments: unknown[], separator?: unknown) => ({
        fragments,
        separator,
      })),
      type: mockType,
      array: vi.fn((values: unknown[], type: string) => ({
        values,
        type,
      })),
    }
  );

  return {
    pool: {
      one: vi.fn(),
      any: vi.fn(),
      maybeOne: vi.fn(),
      query: vi.fn(),
    },
    sql: mockSql,
  };
});

import { pool } from '@/src/server/db';

const mockPool = pool as Mocked<typeof pool>;

// Helper to create a mock QueryResult
const mockQueryResult = (rows: unknown[] = []) => ({
  rows,
  command: 'UPDATE' as const,
  fields: [],
  notices: [],
  rowCount: rows.length,
  type: 'QueryResult' as const,
});

const createCtx = (userId = 'user-1', userName = 'testuser') => ({
  session: {
    user: {
      id: userId,
      name: userName,
      registration_complete: true,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Test: get returns existing binder
describe('binder.get', () => {
  it('returns existing binder with cards', async () => {
    mockPool.maybeOne.mockResolvedValueOnce({
      id: 'binder-1',
      name: 'My Collection',
      description: null,
      is_public: true,
    });
    mockPool.any.mockResolvedValueOnce([
      {
        id: 'card-1',
        printing_id: 'print-1',
        oracle_id: 'oracle-1',
        name: 'Lightning Bolt',
        image_uri_normal: 'https://example.com/bolt.jpg',
        condition: 'Near Mint',
        is_foil: false,
        language: 'en',
        set_name: 'Alpha',
        set_code: 'LEA',
        rarity: 'common',
        price_usd: 1.5,
        acquired_at: '2024-01-01',
      },
    ]);

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.get();

    expect(result.id).toBe('binder-1');
    expect(result.cards).toHaveLength(1);
    expect(result.cardCount).toBe(1);
  });

  it('creates binder if none exists', async () => {
    mockPool.maybeOne.mockResolvedValueOnce(null); // No existing binder
    mockPool.one.mockResolvedValueOnce({
      id: 'new-binder-1',
      name: "testuser's Collection",
      description: null,
      is_public: true,
    });
    mockPool.query.mockResolvedValueOnce(mockQueryResult()); // Update user default
    mockPool.any.mockResolvedValueOnce([]); // No cards yet

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.get();

    expect(result.id).toBe('new-binder-1');
    expect(result.cards).toHaveLength(0);
    expect(mockPool.one).toHaveBeenCalledTimes(1);
  });
});

// Test: list returns binders and defaultBinderId
describe('binder.list', () => {
  it('returns binders and defaultBinderId', async () => {
    mockPool.maybeOne.mockResolvedValueOnce({
      id: 'b1',
      name: 'My Collection',
      card_count: 5,
    });

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.list();

    expect(result.binders).toHaveLength(1);
    expect(result.binders[0].id).toBe('b1');
    expect(result.defaultBinderId).toBe('b1');
  });

  it('creates binder if none exists', async () => {
    mockPool.maybeOne.mockResolvedValueOnce(null);
    mockPool.one.mockResolvedValueOnce({ id: 'new-binder' });
    mockPool.query.mockResolvedValueOnce(mockQueryResult());

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.list();

    expect(result.binders).toHaveLength(1);
    expect(result.defaultBinderId).toBe('new-binder');
  });
});

// Test: update binder settings
describe('binder.update', () => {
  it('updates binder name', async () => {
    mockPool.query.mockResolvedValueOnce(mockQueryResult());

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.update({ name: 'New Name' });

    expect(result.success).toBe(true);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it('skips update when no fields provided', async () => {
    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.update({});

    expect(result.success).toBe(true);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});

// Test: removeCard
describe('binder.removeCard', () => {
  it('removes a card from inventory', async () => {
    mockPool.query.mockResolvedValueOnce(mockQueryResult());

    const caller = binderRouter.createCaller(createCtx());
    const result = await caller.removeCard({
      userCardId: '00000000-0000-1000-a000-000000000001',
    });

    expect(result.success).toBe(true);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });
});

// Test: unauthorized access
it('throws UNAUTHORIZED without session', async () => {
  const caller = binderRouter.createCaller({ session: null });

  await expect(caller.list()).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
});

// Test: getByUsername public procedure
describe('binder.getByUsername', () => {
  it('returns public binder by username', async () => {
    mockPool.maybeOne.mockResolvedValueOnce({
      id: 'binder-1',
      name: "testuser's Collection",
      description: 'My cards',
      user_id: 'user-1',
      username: 'testuser',
    });
    mockPool.any.mockResolvedValueOnce([]);

    const caller = binderRouter.createCaller({ session: null });
    const result = await caller.getByUsername({ username: 'testuser' });

    expect(result?.id).toBe('binder-1');
    expect(result?.username).toBe('testuser');
  });

  it('returns null for non-existent or private binder', async () => {
    mockPool.maybeOne.mockResolvedValueOnce(null);

    const caller = binderRouter.createCaller({ session: null });
    const result = await caller.getByUsername({ username: 'nonexistent' });

    expect(result).toBeNull();
  });
});
