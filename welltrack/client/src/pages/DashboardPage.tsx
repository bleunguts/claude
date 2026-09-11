import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { QuickAddGrid } from "../components/dashboard/QuickAddGrid";
import { StatsCard } from "../components/dashboard/StatsCard";
import { TodaySummary } from "../components/dashboard/TodaySummary";
import { WeekProgress } from "../components/dashboard/WeekProgress";
import { LogEntryModal } from "../components/logging/LogEntryModal";
import { logTypeRegistry } from "../components/logging/registry";
import type { LogType } from "../components/logging/types";

export function DashboardPage() {
  const { user } = useAuth();
  const { isLoading, isError, todayCounts, daysLoggedThisWeek } = useDashboardData();
  const [openType, setOpenType] = useState<LogType | null>(null);

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

      <StatsCard />

      <QuickAddGrid onSelect={setOpenType} />

      {openType && (
        <LogEntryModal
          isOpen
          onClose={() => setOpenType(null)}
          initialType={openType}
          registry={logTypeRegistry}
        />
      )}
    </div>
  );
}
