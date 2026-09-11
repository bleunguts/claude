import { useUserStats } from "../../hooks/useUserStats";

const TYPE_LABELS: { key: "symptom" | "mood" | "medication" | "habit"; label: string }[] = [
  { key: "symptom", label: "Symptoms" },
  { key: "mood", label: "Mood" },
  { key: "medication", label: "Medications" },
  { key: "habit", label: "Habits" },
];

export function StatsCard() {
  const { data, isLoading, isError } = useUserStats();

  if (isLoading) {
    return (
      <div
        className="space-y-3 rounded-xl bg-white p-6 shadow-sm"
        data-testid="stats-card-skeleton"
      >
        <div className="h-5 w-28 animate-pulse rounded bg-teal-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-teal-100" />
          <div className="h-20 animate-pulse rounded-xl bg-teal-100" />
        </div>
        <div className="h-16 animate-pulse rounded-xl bg-teal-100" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl bg-white p-6 text-teal-700 shadow-sm">
        Couldn't load your stats. Try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-teal-800">Your Stats</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-teal-50 p-4 text-center">
          <div className="text-3xl font-semibold text-teal-700">
            {data.averageMoodScoreLast30Days !== null
              ? data.averageMoodScoreLast30Days.toFixed(1)
              : "—"}
          </div>
          <div className="text-sm text-teal-600">Avg mood (30d)</div>
        </div>
        <div className="rounded-xl bg-teal-50 p-4 text-center">
          <div className="text-3xl font-semibold text-teal-700">{data.currentStreakDays}</div>
          <div className="text-sm text-teal-600">
            Day{data.currentStreakDays === 1 ? "" : "s"} streak
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-teal-700">Most logged symptoms (30d)</p>
        {data.topSymptoms.length === 0 ? (
          <p className="text-sm text-teal-600">No symptoms logged in the last 30 days.</p>
        ) : (
          <ul className="space-y-1">
            {data.topSymptoms.map((symptom) => (
              <li
                key={symptom.symptomId}
                className="flex items-center justify-between text-sm text-teal-700"
              >
                <span>{symptom.name}</span>
                <span className="font-medium">{symptom.count}&times;</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-teal-100 pt-3 text-sm text-teal-600">
        {TYPE_LABELS.map(({ key, label }) => (
          <span key={key}>
            {label}: <span className="font-medium text-teal-700">{data.totalLogsByType[key]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
