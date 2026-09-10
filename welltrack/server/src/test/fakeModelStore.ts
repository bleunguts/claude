import { randomUUID } from "node:crypto";
import { vi } from "vitest";

type WhereClause = Record<string, unknown>;
type Row = Record<string, unknown> & { id: string };

function matches(row: Row, where?: WhereClause): boolean {
  if (!where) return true;

  for (const [key, condition] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(condition)) {
      if (!condition.some((clause) => matches(row, clause as WhereClause))) return false;
      continue;
    }

    if (condition === null) {
      if (row[key] !== null) return false;
    } else if (
      condition &&
      typeof condition === "object" &&
      !(condition instanceof Date) &&
      ("gte" in condition || "lte" in condition)
    ) {
      const range = condition as { gte?: Date; lte?: Date };
      const value = row[key] as Date;
      if (range.gte && value < range.gte) return false;
      if (range.lte && value > range.lte) return false;
    } else if (row[key] !== condition) {
      return false;
    }
  }

  return true;
}

/**
 * A minimal in-memory stand-in for one Prisma model delegate, supporting exactly the
 * query shapes this codebase's services issue (equality where-clauses, OR, gte/lte
 * ranges, orderBy on a single field, take/skip). Used to write real integration tests
 * against the actual service layer without a live Postgres instance.
 */
export function createModelStore<T extends Row>() {
  const rows = new Map<string, T>();

  return {
    findMany: vi.fn(
      async ({
        where,
        orderBy,
        take,
        skip,
      }: {
        where?: WhereClause;
        orderBy?: Record<string, "asc" | "desc">;
        take?: number;
        skip?: number;
      } = {}) => {
        let results = [...rows.values()].filter((row) => matches(row, where));

        if (orderBy) {
          const [field] = Object.keys(orderBy) as (keyof T)[];
          const direction = orderBy[field as string];
          results.sort((a, b) => {
            const av = a[field];
            const bv = b[field];
            const cmp = av! < bv! ? -1 : av! > bv! ? 1 : 0;
            return direction === "desc" ? -cmp : cmp;
          });
        }

        if (skip) results = results.slice(skip);
        if (take !== undefined) results = results.slice(0, take);
        return results;
      },
    ),

    count: vi.fn(
      async ({ where }: { where?: WhereClause } = {}) =>
        [...rows.values()].filter((row) => matches(row, where)).length,
    ),

    create: vi.fn(async ({ data }: { data: Partial<T> }) => {
      const row = { id: randomUUID() as string, createdAt: new Date(), ...data } as unknown as T;
      rows.set(row.id, row);
      return row;
    }),

    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),

    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<T> }) => {
      const row = rows.get(where.id);
      if (!row) return null;
      Object.assign(row, data);
      return row;
    }),

    updateMany: vi.fn(
      async ({ where, data }: { where?: WhereClause; data: Record<string, unknown> }) => {
        let count = 0;
        for (const row of rows.values()) {
          if (matches(row, where)) {
            Object.assign(row, data);
            count++;
          }
        }
        return { count };
      },
    ),

    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const row = rows.get(where.id);
      rows.delete(where.id);
      return row ?? null;
    }),
  };
}
