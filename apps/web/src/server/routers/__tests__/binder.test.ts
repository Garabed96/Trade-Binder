// import { TRPCError } from "@trpc/server";
import { binderRouter } from "../binder";

jest.mock("@/src/server/db", () => {
  // Mock sql.type() to return a function that acts as a tagged template
  const mockType = jest.fn(() => {
    return jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      // Add any other properties that slonik sql queries have
      sql: strings.join("?"),
    }));
  });

  const mockSql = Object.assign(
    jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      sql: strings.join("?"),
    })),
    {
      fragment: jest.fn((...args: unknown[]) => args),
      join: jest.fn((fragments: unknown[], separator?: unknown) => ({
        fragments,
        separator,
      })),
      type: mockType,
    }
  );

  return {
    pool: {
      one: jest.fn(),
      any: jest.fn(),
      maybeOne: jest.fn(),
      query: jest.fn(),
    },
    sql: mockSql,
  };
});

import { pool } from "@/src/server/db";

const mockPool = pool as jest.Mocked<typeof pool>;

const createCtx = (userId = "user-1") => ({
  session: {
    user: {
      id: userId,
      registration_complete: true,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Test: create fails when limit reached
describe("binder.create", () => {
  it("creates a binder when under limit", async () => {
    mockPool.one
      .mockResolvedValueOnce({ count: 2 }) // count query
      .mockResolvedValueOnce({ id: "binder-1" }); // insert

    const caller = binderRouter.createCaller(createCtx());

    const result = await caller.create({
      name: "My Binder",
      type: "personal",
      isPublic: false,
    });

    expect(result.id).toBe("binder-1");
    expect(mockPool.one).toHaveBeenCalledTimes(2);
  });
});

// Test: getById returns null when not found
describe("binder.getById", () => {
  it("returns null when binder does not exist", async () => {
    mockPool.maybeOne.mockResolvedValueOnce(null);

    const caller = binderRouter.createCaller(createCtx());

    const result = await caller.getById({
      id: "00000000-0000-0000-0000-000000000000",
    });

    expect(result).toBeNull();
  });
});

// Test: list returns binders + limits
describe("binder.list", () => {
  it("returns binders and limits", async () => {
    mockPool.any.mockResolvedValueOnce([
      {
        id: "b1",
        name: "Binder 1",
        description: null,
        type: "personal",
        is_public: false,
        card_count: 3,
      },
    ]);

    const caller = binderRouter.createCaller(createCtx());

    const result = await caller.list();

    expect(result.binders).toHaveLength(1);
    expect(result.limits.canCreateBinder).toBe(true);
    expect(result.limits.binderCount).toBe(1);
  });
});

// Test: unauthorized access (important)
it("throws UNAUTHORIZED without session", async () => {
  const caller = binderRouter.createCaller({ session: null });

  await expect(caller.list()).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  });
});
