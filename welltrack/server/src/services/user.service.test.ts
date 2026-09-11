import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats } from "./user.service.js";
import { UnauthorizedError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    user: { findUnique: vi.fn() },
    moodLog: { findMany: vi.fn(), count: vi.fn() },
    symptomLog: { findMany: vi.fn(), count: vi.fn() },
    medicationLog: { findMany: vi.fn(), count: vi.fn() },
    habitLog: { findMany: vi.fn(), count: vi.fn() },
  } as unknown as PrismaClient & {
    user: { findUnique: ReturnType<typeof vi.fn> };
    moodLog: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    symptomLog: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    medicationLog: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    habitLog: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  };
}

function daysAgo(days: number, hour = 12): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

/** Default every query the service issues to an empty/zero result, then override per test. */
function stubEmpty(client: ReturnType<typeof fakePrisma>) {
  client.user.findUnique.mockResolvedValue({ timezone: "UTC" });
  client.moodLog.findMany.mockResolvedValue([]);
  client.symptomLog.findMany.mockResolvedValue([]);
  client.medicationLog.findMany.mockResolvedValue([]);
  client.habitLog.findMany.mockResolvedValue([]);
  client.symptomLog.count.mockResolvedValue(0);
  client.moodLog.count.mockResolvedValue(0);
  client.medicationLog.count.mockResolvedValue(0);
  client.habitLog.count.mockResolvedValue(0);
}

describe("user.service getUserStats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws UnauthorizedError when the user no longer exists", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(null);

    await expect(getUserStats("ghost-user", client)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns zeroed-out stats for a user with no logs at all", async () => {
    const client = fakePrisma();
    stubEmpty(client);

    const result = await getUserStats("user-1", client);

    expect(result).toEqual({
      averageMoodScoreLast30Days: null,
      topSymptoms: [],
      currentStreakDays: 0,
      totalLogsByType: { symptom: 0, mood: 0, medication: 0, habit: 0 },
    });
  });

  it("averages only mood logs within the last 30 days", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    client.moodLog.findMany.mockResolvedValue([
      { moodScore: 4, loggedAt: daysAgo(1) },
      { moodScore: 2, loggedAt: daysAgo(5) },
      { moodScore: 5, loggedAt: daysAgo(40) }, // outside the window, must be excluded
    ]);

    const result = await getUserStats("user-1", client);

    expect(result.averageMoodScoreLast30Days).toBe(3);
  });

  it("ranks the top 5 most frequently logged symptoms within the last 30 days", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    client.symptomLog.findMany.mockResolvedValue([
      { symptomId: "headache", loggedAt: daysAgo(1), symptom: { name: "Headache" } },
      { symptomId: "headache", loggedAt: daysAgo(2), symptom: { name: "Headache" } },
      { symptomId: "headache", loggedAt: daysAgo(3), symptom: { name: "Headache" } },
      { symptomId: "fatigue", loggedAt: daysAgo(1), symptom: { name: "Fatigue" } },
      { symptomId: "fatigue", loggedAt: daysAgo(2), symptom: { name: "Fatigue" } },
      { symptomId: "nausea", loggedAt: daysAgo(60), symptom: { name: "Nausea" } }, // outside window
    ]);

    const result = await getUserStats("user-1", client);

    expect(result.topSymptoms).toEqual([
      { symptomId: "headache", name: "Headache", count: 3 },
      { symptomId: "fatigue", name: "Fatigue", count: 2 },
    ]);
  });

  it("caps top symptoms at 5", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    client.symptomLog.findMany.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({
        symptomId: `symptom-${i}`,
        loggedAt: daysAgo(1),
        symptom: { name: `Symptom ${i}` },
      })),
    );

    const result = await getUserStats("user-1", client);

    expect(result.topSymptoms).toHaveLength(5);
  });

  it("counts a consecutive streak ending today across log types", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    // today: symptom log; yesterday: mood log; 2 days ago: habit log; 3 days ago: gap
    client.symptomLog.findMany.mockResolvedValue([
      { symptomId: "s1", loggedAt: daysAgo(0), symptom: { name: "Headache" } },
    ]);
    client.moodLog.findMany.mockResolvedValue([{ loggedAt: daysAgo(1) }]);
    client.habitLog.findMany.mockResolvedValue([{ loggedAt: daysAgo(2) }]);

    const result = await getUserStats("user-1", client);

    expect(result.currentStreakDays).toBe(3);
  });

  it("reports a 0 streak when today has no log yet, even if yesterday does", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    client.moodLog.findMany.mockResolvedValue([{ loggedAt: daysAgo(1) }]);

    const result = await getUserStats("user-1", client);

    expect(result.currentStreakDays).toBe(0);
  });

  it("reports all-time totals per log type regardless of the 30-day windows", async () => {
    const client = fakePrisma();
    stubEmpty(client);
    client.symptomLog.count.mockResolvedValue(42);
    client.moodLog.count.mockResolvedValue(10);
    client.medicationLog.count.mockResolvedValue(7);
    client.habitLog.count.mockResolvedValue(3);

    const result = await getUserStats("user-1", client);

    expect(result.totalLogsByType).toEqual({ symptom: 42, mood: 10, medication: 7, habit: 3 });
  });
});
