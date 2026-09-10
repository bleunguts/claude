import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../hooks/useDashboardData", () => ({ useDashboardData: vi.fn() }));

const BASE_COUNTS = { symptom: 0, mood: 0, medication: 0, habit: 0 };

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
});
