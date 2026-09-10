import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import type { HabitLog, MedicationLog, MoodLog, PaginatedResult, SymptomLog } from "../types/api";

export interface DashboardData {
  isLoading: boolean;
  isError: boolean;
  todayCounts: {
    symptom: number;
    mood: number;
    medication: number;
    habit: number;
  };
  daysLoggedThisWeek: number;
}

const LOOKBACK_DAYS = 8;
const WEEK_DAYS = 7;

// Buckets a UTC instant into the user's local calendar day without a timezone
// library: Intl.DateTimeFormat with the "en-CA" locale natively supports IANA
// zones and formats as YYYY-MM-DD, which sorts/compares as a plain string.
function toLocalDayString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const EMPTY_DATA: DashboardData = {
  isLoading: false,
  isError: false,
  todayCounts: { symptom: 0, mood: 0, medication: 0, habit: 0 },
  daysLoggedThisWeek: 0,
};

export function useDashboardData(): DashboardData {
  const { user } = useAuth();

  // Computed once per mount, not per render: these feed the query keys below, and a
  // fresh `Date.now()` on every render would change the keys every time, causing
  // TanStack Query to treat each render as a new query and refetch in a tight loop.
  const { now, startDate, endDate } = useMemo(() => {
    const now = new Date();
    return {
      now,
      startDate: new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      endDate: now.toISOString(),
    };
  }, []);
  const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&limit=200`;

  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "symptom-logs", startDate, endDate],
        queryFn: () => apiFetch<PaginatedResult<SymptomLog>>(`/symptom-logs?${params}`),
        enabled: !!user,
      },
      {
        queryKey: ["dashboard", "mood-logs", startDate, endDate],
        queryFn: () => apiFetch<PaginatedResult<MoodLog>>(`/mood-logs?${params}`),
        enabled: !!user,
      },
      {
        queryKey: ["dashboard", "medication-logs", startDate, endDate],
        queryFn: () => apiFetch<PaginatedResult<MedicationLog>>(`/medication-logs?${params}`),
        enabled: !!user,
      },
      {
        queryKey: ["dashboard", "habit-logs", startDate, endDate],
        queryFn: () => apiFetch<PaginatedResult<HabitLog>>(`/habit-logs?${params}`),
        enabled: !!user,
      },
    ],
  });

  const [symptomQuery, moodQuery, medicationQuery, habitQuery] = results;

  if (!user) {
    return EMPTY_DATA;
  }

  const isLoading = results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);

  const timezone = user.timezone;
  const todayStr = toLocalDayString(now, timezone);

  const weekDayStrings = new Set<string>();
  for (let i = 0; i < WEEK_DAYS; i++) {
    weekDayStrings.add(
      toLocalDayString(new Date(now.getTime() - i * 24 * 60 * 60 * 1000), timezone),
    );
  }

  const symptomLogs = symptomQuery.data?.items ?? [];
  const moodLogs = moodQuery.data?.items ?? [];
  const medicationLogs = medicationQuery.data?.items ?? [];
  const habitLogs = habitQuery.data?.items ?? [];

  const todayCounts = {
    symptom: symptomLogs.filter(
      (log) => toLocalDayString(new Date(log.loggedAt), timezone) === todayStr,
    ).length,
    mood: moodLogs.filter((log) => toLocalDayString(new Date(log.loggedAt), timezone) === todayStr)
      .length,
    medication: medicationLogs.filter(
      (log) => toLocalDayString(new Date(log.createdAt), timezone) === todayStr,
    ).length,
    habit: habitLogs.filter(
      (log) => toLocalDayString(new Date(log.loggedAt), timezone) === todayStr,
    ).length,
  };

  const loggedDays = new Set<string>();
  for (const log of symptomLogs) loggedDays.add(toLocalDayString(new Date(log.loggedAt), timezone));
  for (const log of moodLogs) loggedDays.add(toLocalDayString(new Date(log.loggedAt), timezone));
  for (const log of medicationLogs)
    loggedDays.add(toLocalDayString(new Date(log.createdAt), timezone));
  for (const log of habitLogs) loggedDays.add(toLocalDayString(new Date(log.loggedAt), timezone));

  let daysLoggedThisWeek = 0;
  for (const day of loggedDays) {
    if (weekDayStrings.has(day)) daysLoggedThisWeek++;
  }

  return { isLoading, isError, todayCounts, daysLoggedThisWeek };
}
