import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { QuickAddGrid } from "../components/dashboard/QuickAddGrid";
import { TodaySummary } from "../components/dashboard/TodaySummary";
import { WeekProgress } from "../components/dashboard/WeekProgress";

export function DashboardPage() {
  const { user } = useAuth();
  const { isLoading, isError, todayCounts, daysLoggedThisWeek } = useDashboardData();

  const today = new Intl.DateTimeFormat(undefined, {
    timeZone: user?.timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold text-teal-800">{today}</h1>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && isError && (
        <div className="rounded-xl bg-white p-6 text-teal-700 shadow-sm">
          Couldn't load your dashboard data. Try refreshing.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <TodaySummary todayCounts={todayCounts} />
          <WeekProgress daysLoggedThisWeek={daysLoggedThisWeek} />
        </>
      )}

      <QuickAddGrid />
    </div>
  );
}
