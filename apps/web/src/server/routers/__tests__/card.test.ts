import { cardRouter } from "../card";

jest.mock("@/src/server/db", () => {
  const mockType = jest.fn(() => {
    return jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
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
      fragment: jest.fn((...args: unknown[]) => ({ type: "fragment", args })),
      join: jest.fn((fragments: unknown[], separator?: unknown) => ({
        type: "join",
        fragments,
        separator,
      })),
      array: jest.fn((values: unknown[], type: string) => ({
        type: "array",
        values,
        sqlType: type,
      })),
      identifier: jest.fn((names: string[]) => ({
        type: "identifier",
        names,
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

import { pool, sql } from "@/src/server/db";

const mockPool = pool as jest.Mocked<typeof pool>;
const mockSql = sql as jest.Mocked<typeof sql>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("card.search", () => {
  const mockCards = [
    {
      id: "card-1",
      name: "Lightning Bolt",
      set_name: "Alpha",
      set_code: "lea",
      rarity: "common",
      image_uri_normal: "http://example.com/bolt.jpg",
      price_usd: 1.5,
    },
  ];

  it("returns cards without filters", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    const result = await caller.search({});

    expect(result.cards).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(mockPool.one).toHaveBeenCalledTimes(1);
    expect(mockPool.any).toHaveBeenCalledTimes(1);
  });

  it("applies name query filter", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({ query: "Lightning" });

    expect(mockSql.fragment).toHaveBeenCalledWith(
      expect.anything(),
      "%Lightning%"
    );
  });

  it("applies rarity filter", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({ rarity: "mythic" });

    expect(mockSql.fragment).toHaveBeenCalledWith(expect.anything(), "mythic");
  });

  it("applies set_code filter (lowercased)", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({ set_code: "LEA" });

    expect(mockSql.fragment).toHaveBeenCalledWith(expect.anything(), "lea");
  });

  it("applies color filter with sql.array", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({ colors: ["W"] });

    expect(mockSql.array).toHaveBeenCalledWith(["W"], "text");
  });

  it("applies multiple color filters for exact match", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({ colors: ["W", "U"] });

    expect(mockSql.array).toHaveBeenCalledWith(["W", "U"], "text");
  });

  it("calculates pagination correctly", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 100 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    const result = await caller.search({ page: 2 });

    expect(result.totalPages).toBe(3); // 100 / 40 = 2.5, ceil = 3
  });

  it("combines multiple filters", async () => {
    mockPool.one.mockResolvedValueOnce({ total: 1 });
    mockPool.any.mockResolvedValueOnce(mockCards);

    const caller = cardRouter.createCaller({});
    await caller.search({
      query: "Bolt",
      rarity: "common",
      set_code: "lea",
      colors: ["R"],
    });

    // sql.join should be called to combine filters with AND
    expect(mockSql.join).toHaveBeenCalled();
    // Verify all filter types were applied
    expect(mockSql.fragment).toHaveBeenCalled();
    expect(mockSql.array).toHaveBeenCalledWith(["R"], "text");
  });
});

describe("card.fuzzySearch", () => {
  it("returns matching cards", async () => {
    const mockResults = [
      {
        id: "card-1",
        name: "Lightning Bolt",
        image_uri_normal: "http://example.com/bolt.jpg",
        set_name: "Alpha",
        set_code: "lea",
        price_usd: 1.5,
      },
    ];
    mockPool.any.mockResolvedValueOnce(mockResults);

    const caller = cardRouter.createCaller({});
    const result = await caller.fuzzySearch({ query: "Lightning" });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Lightning Bolt");
  });

  it("requires minimum 3 characters", async () => {
    const caller = cardRouter.createCaller({});

    await expect(caller.fuzzySearch({ query: "Li" })).rejects.toThrow();
  });
});

describe("card.getById", () => {
  it("returns card details", async () => {
    const mockCard = {
      id: "card-1",
      name: "Lightning Bolt",
      set_name: "Alpha",
      set_code: "lea",
      rarity: "common",
      image_uri_normal: "http://example.com/bolt.jpg",
      price_usd: 1.5,
      oracle_text: "Deal 3 damage to any target.",
      type_line: "Instant",
      mana_cost: "{R}",
    };
    mockPool.maybeOne.mockResolvedValueOnce(mockCard);

    const caller = cardRouter.createCaller({});
    const result = await caller.getById({ id: "card-1" });

    expect(result?.name).toBe("Lightning Bolt");
    expect(result?.oracle_text).toBe("Deal 3 damage to any target.");
  });

  it("returns null when card not found", async () => {
    mockPool.maybeOne.mockResolvedValueOnce(null);

    const caller = cardRouter.createCaller({});
    const result = await caller.getById({ id: "nonexistent" });

    expect(result).toBeNull();
  });
});

describe("card.listSets", () => {
  it("returns all sets", async () => {
    const mockSets = [
      { code: "lea", name: "Alpha" },
      { code: "leb", name: "Beta" },
    ];
    mockPool.any.mockResolvedValueOnce(mockSets);

    const caller = cardRouter.createCaller({});
    const result = await caller.listSets();

    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("lea");
  });
});

describe("card.getLatestSet", () => {
  it("returns the latest set", async () => {
    const mockSet = {
      code: "dmu",
      name: "Dominaria United",
      released_at: "2022-09-09",
    };
    mockPool.maybeOne.mockResolvedValueOnce(mockSet);

    const caller = cardRouter.createCaller({});
    const result = await caller.getLatestSet();

    expect(result?.code).toBe("dmu");
  });
});
