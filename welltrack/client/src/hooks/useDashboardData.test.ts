import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDashboardData } from "./useDashboardData";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import type { HabitLog, MedicationLog, MoodLog, PaginatedResult, SymptomLog } from "../types/api";

vi.mock("../lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  displayName: "Test User",
  timezone: "UTC",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function empty<T>(): PaginatedResult<T> {
  return { items: [], total: 0 };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("computes today's counts per log type using loggedAt/createdAt in the user's timezone", async () => {
    const now = new Date();
    const todayIso = now.toISOString();
    const yesterdayIso = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const symptomLogs: SymptomLog[] = [
      {
        id: "s1",
        userId: "user-1",
        symptomId: "sym-1",
        severity: 3,
        notes: null,
        loggedAt: todayIso,
        createdAt: todayIso,
      },
      {
        id: "s2",
        userId: "user-1",
        symptomId: "sym-1",
        severity: 2,
        notes: null,
        loggedAt: yesterdayIso,
        createdAt: yesterdayIso,
      },
    ];
    const moodLogs: MoodLog[] = [
      {
        id: "m1",
        userId: "user-1",
        moodScore: 4,
        energyLevel: null,
        stressLevel: null,
        notes: null,
        loggedAt: todayIso,
        createdAt: todayIso,
      },
    ];
    const medicationLogs: MedicationLog[] = [
      {
        id: "med1",
        userId: "user-1",
        medicationId: "medic-1",
        taken: true,
        takenAt: todayIso,
        notes: null,
        createdAt: todayIso,
      },
      {
        id: "med2",
        userId: "user-1",
        medicationId: "medic-1",
        taken: true,
        takenAt: yesterdayIso,
        notes: null,
        createdAt: yesterdayIso,
      },
    ];
    const habitLogs: HabitLog[] = [];

    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path.startsWith("/symptom-logs"))
        return { items: symptomLogs, total: symptomLogs.length };
      if (path.startsWith("/mood-logs")) return { items: moodLogs, total: moodLogs.length };
      if (path.startsWith("/medication-logs"))
        return { items: medicationLogs, total: medicationLogs.length };
      if (path.startsWith("/habit-logs")) return { items: habitLogs, total: habitLogs.length };
      throw new Error(`unexpected path: ${path}`);
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.todayCounts).toEqual({
      symptom: 1,
      mood: 1,
      medication: 1,
      habit: 0,
    });
  });

  it("counts distinct days logged across mixed log types within the last 7 days", async () => {
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    const symptomLogs: SymptomLog[] = [
      {
        id: "s1",
        userId: "user-1",
        symptomId: "sym-1",
        severity: 1,
        notes: null,
        loggedAt: daysAgo(0),
        createdAt: daysAgo(0),
      },
      {
        id: "s2",
        userId: "user-1",
        symptomId: "sym-1",
        severity: 1,
        notes: null,
        loggedAt: daysAgo(3),
        createdAt: daysAgo(3),
      },
    ];
    const moodLogs: MoodLog[] = [
      {
        id: "m1",
        userId: "user-1",
        moodScore: 3,
        energyLevel: null,
        stressLevel: null,
        notes: null,
        loggedAt: daysAgo(3),
        createdAt: daysAgo(3),
      },
      {
        id: "m2",
        userId: "user-1",
        moodScore: 3,
        energyLevel: null,
        stressLevel: null,
        notes: null,
        loggedAt: daysAgo(6),
        createdAt: daysAgo(6),
      },
    ];
    const medicationLogs: MedicationLog[] = [
      {
        id: "med1",
        userId: "user-1",
        medicationId: "medic-1",
        taken: true,
        takenAt: daysAgo(7),
        notes: null,
        createdAt: daysAgo(7),
      },
    ];
    const habitLogs: HabitLog[] = [
      {
        id: "h1",
        userId: "user-1",
        habitId: "habit-1",
        valueBoolean: true,
        valueNumeric: null,
        valueDuration: null,
        notes: null,
        loggedAt: daysAgo(1),
        createdAt: daysAgo(1),
      },
    ];

    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path.startsWith("/symptom-logs"))
        return { items: symptomLogs, total: symptomLogs.length };
      if (path.startsWith("/mood-logs")) return { items: moodLogs, total: moodLogs.length };
      if (path.startsWith("/medication-logs"))
        return { items: medicationLogs, total: medicationLogs.length };
      if (path.startsWith("/habit-logs")) return { items: habitLogs, total: habitLogs.length };
      throw new Error(`unexpected path: ${path}`);
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Distinct local days within the last 7 days: 0, 3, 6, 1 => 4 (day 7 falls outside the window)
    expect(result.current.daysLoggedThisWeek).toBe(4);
  });

  it("reports isLoading while queries are in flight and isError when a query fails", async () => {
    let resolveSymptoms!: (value: PaginatedResult<SymptomLog>) => void;
    const symptomsPromise = new Promise<PaginatedResult<SymptomLog>>((resolve) => {
      resolveSymptoms = resolve;
    });

    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path.startsWith("/symptom-logs")) return symptomsPromise;
      if (path.startsWith("/mood-logs")) return empty<MoodLog>();
      if (path.startsWith("/medication-logs")) throw new Error("medication logs failed");
      if (path.startsWith("/habit-logs")) return empty<HabitLog>();
      throw new Error(`unexpected path: ${path}`);
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    resolveSymptoms(empty<SymptomLog>());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });

  it("returns zeroed-out data without throwing when there is no user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current).toEqual({
      isLoading: false,
      isError: false,
      todayCounts: { symptom: 0, mood: 0, medication: 0, habit: 0 },
      daysLoggedThisWeek: 0,
    });
  });
});
