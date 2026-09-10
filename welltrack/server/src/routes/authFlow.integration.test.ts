import { describe, it, expect, vi } from "vitest";

// A hand-rolled in-memory fake for exactly the two models the auth flow touches
// (user, refreshToken), so this test exercises the real passwordService,
// tokenService, and auth.service logic end to end without a live Postgres.
const fakePrisma = vi.hoisted(() => {
  interface FakeUser {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    timezone: string;
    createdAt: Date;
  }
  interface FakeRefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }

  const usersByEmail = new Map<string, FakeUser>();
  const usersById = new Map<string, FakeUser>();
  const refreshTokensByHash = new Map<string, FakeRefreshToken>();
  let nextUserId = 1;
  let nextTokenId = 1;

  return {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) return usersByEmail.get(where.email) ?? null;
        if (where.id) return usersById.get(where.id) ?? null;
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Partial<FakeUser> }) => {
        const user: FakeUser = {
          id: `user-${nextUserId++}`,
          timezone: "UTC",
          createdAt: new Date(),
          ...data,
        } as FakeUser;
        usersByEmail.set(user.email, user);
        usersById.set(user.id, user);
        return user;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeUser> }) => {
        const user = usersById.get(where.id);
        if (!user) return null;
        Object.assign(user, data);
        return user;
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: { data: Omit<FakeRefreshToken, "id" | "revokedAt"> }) => {
        const token: FakeRefreshToken = { id: `rt-${nextTokenId++}`, revokedAt: null, ...data };
        refreshTokensByHash.set(token.tokenHash, token);
        return token;
      }),
      findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
        const token = refreshTokensByHash.get(where.tokenHash);
        if (!token) return null;
        return { ...token, user: usersById.get(token.userId) ?? null };
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<FakeRefreshToken> }) => {
          const token = [...refreshTokensByHash.values()].find((t) => t.id === where.id);
          if (!token) return null;
          Object.assign(token, data);
          return token;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { tokenHash: string; revokedAt: null };
          data: Partial<FakeRefreshToken>;
        }) => {
          let count = 0;
          for (const token of refreshTokensByHash.values()) {
            if (token.tokenHash === where.tokenHash && token.revokedAt === where.revokedAt) {
              Object.assign(token, data);
              count++;
            }
          }
          return { count };
        },
      ),
    },
  };
});

vi.mock("../lib/prisma.js", () => ({ prisma: fakePrisma }));

import request from "supertest";
import { app } from "../app.js";

describe("auth flow integration (register -> login -> refresh -> logout -> refresh fails)", () => {
  it("supports the full happy-path flow and rejects reuse of rotated/revoked tokens", async () => {
    const credentials = {
      email: "flow@example.com",
      password: "hunter2pass",
      displayName: "Flow User",
    };

    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe(credentials.email);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(loginRes.status).toBe(200);
    const loginRefreshToken: string = loginRes.body.refreshToken;

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRefreshToken });
    expect(refreshRes.status).toBe(200);
    const rotatedRefreshToken: string = refreshRes.body.refreshToken;
    expect(rotatedRefreshToken).not.toBe(loginRefreshToken);

    // Reusing the pre-rotation token (now revoked by the refresh above) must fail.
    const reuseRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRefreshToken });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body).toMatchObject({ error: { code: "INVALID_REFRESH_TOKEN" } });

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: rotatedRefreshToken });
    expect(logoutRes.status).toBe(204);

    // Refresh must fail once the token has been revoked by logout.
    const refreshAfterLogoutRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rotatedRefreshToken });
    expect(refreshAfterLogoutRes.status).toBe(401);
    expect(refreshAfterLogoutRes.body).toMatchObject({ error: { code: "INVALID_REFRESH_TOKEN" } });
  });

  it("returns the same generic error for an unknown email and a wrong password", async () => {
    const email = "flow2@example.com";
    await request(app)
      .post("/api/auth/register")
      .send({ email, password: "hunter2pass", displayName: "Flow2" });

    const wrongPasswordRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword1" });
    const unknownEmailRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@example.com", password: "whatever123" });

    expect(wrongPasswordRes.status).toBe(401);
    expect(unknownEmailRes.status).toBe(401);
    expect(wrongPasswordRes.body).toEqual(unknownEmailRes.body);
  });
});
