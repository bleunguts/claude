import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "../generated/prisma/client.js";
import { checkDatabaseConnection } from "./health.service.js";

function fakePrisma(queryRaw: (...args: unknown[]) => unknown) {
  return { $queryRaw: vi.fn(queryRaw) } as unknown as PrismaClient;
}

describe("checkDatabaseConnection", () => {
  it("resolves true when the query succeeds", async () => {
    const client = fakePrisma(() => Promise.resolve([{ "?column?": 1 }]));
    await expect(checkDatabaseConnection(client)).resolves.toBe(true);
  });

  it("resolves false when the query rejects, without throwing", async () => {
    const client = fakePrisma(() => Promise.reject(new Error("ECONNREFUSED")));
    await expect(checkDatabaseConnection(client)).resolves.toBe(false);
  });
});
