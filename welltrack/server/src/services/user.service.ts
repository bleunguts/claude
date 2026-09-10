import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../lib/errors.js";

const MOOD_WINDOW_DAYS = 30;
const SYMPTOM_WINDOW_DAYS = 30;
// Streaks aren't tracked beyond this; a gap-free run longer than a year isn't worth the
// extra query cost of an unbounded lookback for an MVP stats endpoint.
const STREAK_LOOKBACK_DAYS = 366;
const TOP_SYMPTOMS_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TopSymptom {
  symptomId: string;
  name: string;
  count: number;
}

export interface UserStats {
  averageMoodScoreLast30Days: number | null;
  topSymptoms: TopSymptom[];
  currentStreakDays: number;
  totalLogsByType: {
    symptom: number;
    mood: number;
    medication: number;
    habit: number;
  };
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

// Buckets a UTC instant into the user's local calendar day without a timezone library:
// Intl.DateTimeFormat with the "en-CA" locale natively supports IANA zones and formats
// as YYYY-MM-DD, which sorts/compares as a plain string.
function toLocalDayString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getUserStats(
  userId: string,
  client: PrismaClient = defaultPrisma,
): Promise<UserStats> {
  const user = await client.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  if (!user) {
    throw new UnauthorizedError("User not found", "USER_NOT_FOUND");
  }
  const timezone = user.timezone;

  // +1 day of buffer on the fetch window so the earliest local calendar day in the
  // window isn't clipped by the UTC lower bound (same over-fetch-then-bucket-in-JS
  // approach the client dashboard uses, for the same reason: a naive UTC endDate/
  // startDate pair doesn't align with local calendar day boundaries).
  const moodWindowStart = daysAgo(MOOD_WINDOW_DAYS + 1);
  const symptomWindowStart = daysAgo(SYMPTOM_WINDOW_DAYS + 1);
  const streakWindowStart = daysAgo(STREAK_LOOKBACK_DAYS);

  const [
    moodLogs,
    symptomLogsForTop,
    streakSymptomLogs,
    streakMoodLogs,
    streakMedicationLogs,
    streakHabitLogs,
    totalSymptom,
    totalMood,
    totalMedication,
    totalHabit,
  ] = await Promise.all([
    client.moodLog.findMany({
      where: { userId, loggedAt: { gte: moodWindowStart } },
      select: { moodScore: true, loggedAt: true },
    }),
    client.symptomLog.findMany({
      where: { userId, loggedAt: { gte: symptomWindowStart } },
      select: { symptomId: true, loggedAt: true, symptom: { select: { name: true } } },
    }),
    client.symptomLog.findMany({
      where: { userId, loggedAt: { gte: streakWindowStart } },
      select: { loggedAt: true },
    }),
    client.moodLog.findMany({
      where: { userId, loggedAt: { gte: streakWindowStart } },
      select: { loggedAt: true },
    }),
    client.medicationLog.findMany({
      where: { userId, createdAt: { gte: streakWindowStart } },
      select: { createdAt: true },
    }),
    client.habitLog.findMany({
      where: { userId, loggedAt: { gte: streakWindowStart } },
      select: { loggedAt: true },
    }),
    client.symptomLog.count({ where: { userId } }),
    client.moodLog.count({ where: { userId } }),
    client.medicationLog.count({ where: { userId } }),
    client.habitLog.count({ where: { userId } }),
  ]);

  const moodWindowDays = new Set<string>();
  for (let i = 0; i < MOOD_WINDOW_DAYS; i++) {
    moodWindowDays.add(toLocalDayString(daysAgo(i), timezone));
  }
  const moodScoresInWindow = moodLogs
    .filter((log) => moodWindowDays.has(toLocalDayString(log.loggedAt, timezone)))
    .map((log) => log.moodScore);
  const averageMoodScoreLast30Days =
    moodScoresInWindow.length > 0
      ? Math.round(
          (moodScoresInWindow.reduce((sum, score) => sum + score, 0) / moodScoresInWindow.length) *
            100,
        ) / 100
      : null;

  const symptomWindowDays = new Set<string>();
  for (let i = 0; i < SYMPTOM_WINDOW_DAYS; i++) {
    symptomWindowDays.add(toLocalDayString(daysAgo(i), timezone));
  }
  const symptomCounts = new Map<string, TopSymptom>();
  for (const log of symptomLogsForTop) {
    if (!symptomWindowDays.has(toLocalDayString(log.loggedAt, timezone))) continue;
    const existing = symptomCounts.get(log.symptomId);
    if (existing) {
      existing.count += 1;
    } else {
      symptomCounts.set(log.symptomId, {
        symptomId: log.symptomId,
        name: log.symptom.name,
        count: 1,
      });
    }
  }
  const topSymptoms = [...symptomCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SYMPTOMS_LIMIT);

  const loggedDays = new Set<string>();
  for (const log of streakSymptomLogs) loggedDays.add(toLocalDayString(log.loggedAt, timezone));
  for (const log of streakMoodLogs) loggedDays.add(toLocalDayString(log.loggedAt, timezone));
  for (const log of streakMedicationLogs) loggedDays.add(toLocalDayString(log.createdAt, timezone));
  for (const log of streakHabitLogs) loggedDays.add(toLocalDayString(log.loggedAt, timezone));

  // Counts backward from today; if nothing has been logged yet today, the streak reads
  // 0 until the first log of the day lands (it does not fall back to "yesterday" while
  // today is still in progress).
  let currentStreakDays = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    if (!loggedDays.has(toLocalDayString(daysAgo(i), timezone))) break;
    currentStreakDays += 1;
  }

  return {
    averageMoodScoreLast30Days,
    topSymptoms,
    currentStreakDays,
    totalLogsByType: {
      symptom: totalSymptom,
      mood: totalMood,
      medication: totalMedication,
      habit: totalHabit,
    },
  };
}
