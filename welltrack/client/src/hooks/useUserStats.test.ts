import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUserStats } from "./useUserStats.js";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import type { UserStats } from "../types/api";

vi.mock("../lib/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  displayName: "Test User",
  timezone: "UTC",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const stats: UserStats = {
  averageMoodScoreLast30Days: 3.5,
  topSymptoms: [{ symptomId: "s1", name: "Headache", count: 4 }],
  currentStreakDays: 6,
  totalLogsByType: { symptom: 10, mood: 8, medication: 2, habit: 5 },
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useUserStats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("fetches /stats and returns the result", async () => {
    vi.mocked(apiFetch).mockResolvedValue(stats);

    const { result } = renderHook(() => useUserStats(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiFetch).toHaveBeenCalledWith("/stats");
    expect(result.current.data).toEqual(stats);
  });

  it("does not fetch when there is no authenticated user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useUserStats(), { wrapper });

    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("reports isError when the request fails", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useUserStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
