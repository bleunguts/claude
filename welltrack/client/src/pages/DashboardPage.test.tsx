import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { useUserStats } from "../hooks/useUserStats";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../hooks/useDashboardData", () => ({ useDashboardData: vi.fn() }));
vi.mock("../hooks/useUserStats", () => ({ useUserStats: vi.fn() }));

const BASE_COUNTS = { symptom: 0, mood: 0, medication: 0, habit: 0 };

const BASE_STATS = {
  averageMoodScoreLast30Days: 3.5,
  topSymptoms: [{ symptomId: "s1", name: "Headache", count: 4 }],
  currentStreakDays: 6,
  // Deliberately outside 0-4: those overlap with the specific counts the
  // "shows counts when counts are non-zero" test below asserts on for TodaySummary.
  totalLogsByType: { symptom: 41, mood: 27, medication: 19, habit: 33 },
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        email: "sarah@example.com",
        displayName: "Sarah",
        timezone: "UTC",
      } as ReturnType<typeof useAuth>["user"],
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useUserStats).mockReturnValue({
      data: BASE_STATS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useUserStats>);
  });

  it("renders the four quick-add buttons", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      isError: false,
      todayCounts: BASE_COUNTS,
      daysLoggedThisWeek: 0,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId("quick-add-symptom")).toBeInTheDocument();
    expect(screen.getByTestId("quick-add-mood")).toBeInTheDocument();
    expect(screen.getByTestId("quick-add-medication")).toBeInTheDocument();
    expect(screen.getByTestId("quick-add-habit")).toBeInTheDocument();
  });

  it("shows the empty state when all counts are 0", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      isError: false,
      todayCounts: BASE_COUNTS,
      daysLoggedThisWeek: 0,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/nothing logged yet today/i)).toBeInTheDocument();
  });

  it("shows counts when counts are non-zero", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      isError: false,
      todayCounts: { symptom: 2, mood: 1, medication: 0, habit: 3 },
      daysLoggedThisWeek: 4,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.queryByText(/nothing logged yet today/i)).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/4 of 7 days logged this week/i)).toBeInTheDocument();
  });

  it("shows loading skeletons when isLoading is true", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: true,
      isError: false,
      todayCounts: BASE_COUNTS,
      daysLoggedThisWeek: 0,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
    expect(screen.queryByText(/nothing logged yet today/i)).not.toBeInTheDocument();
  });

  it("shows the error message when isError is true", () => {
    vi.mocked(useDashboardData).mockReturnValue({
      isLoading: false,
      isError: true,
      todayCounts: BASE_COUNTS,
      daysLoggedThisWeek: 0,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/couldn't load your dashboard data/i)).toBeInTheDocument();
  });

  describe("Your Stats card", () => {
    beforeEach(() => {
      vi.mocked(useDashboardData).mockReturnValue({
        isLoading: false,
        isError: false,
        todayCounts: BASE_COUNTS,
        daysLoggedThisWeek: 0,
      });
    });

    it("shows a loading skeleton while stats are fetching", () => {
      vi.mocked(useUserStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof useUserStats>);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("stats-card-skeleton")).toBeInTheDocument();
      expect(screen.queryByText("Your Stats")).not.toBeInTheDocument();
    });

    it("shows an error message when the stats request fails", () => {
      vi.mocked(useUserStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useUserStats>);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText(/couldn't load your stats/i)).toBeInTheDocument();
    });

    it("formats the average mood, streak, top symptoms, and totals", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("Your Stats")).toBeInTheDocument();
      expect(screen.getByText("3.5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("Days streak")).toBeInTheDocument();
      expect(screen.getByText("Headache")).toBeInTheDocument();
      expect(screen.getByText("4×")).toBeInTheDocument();
    });

    it("shows a dash for average mood and an empty-symptoms message when there's no data yet", () => {
      vi.mocked(useUserStats).mockReturnValue({
        data: {
          averageMoodScoreLast30Days: null,
          topSymptoms: [],
          currentStreakDays: 1,
          totalLogsByType: { symptom: 0, mood: 0, medication: 0, habit: 0 },
        },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useUserStats>);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByText("Day streak")).toBeInTheDocument();
      expect(screen.getByText(/no symptoms logged in the last 30 days/i)).toBeInTheDocument();
    });
  });
});
