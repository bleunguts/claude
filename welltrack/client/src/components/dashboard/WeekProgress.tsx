export function WeekProgress({ daysLoggedThisWeek }: { daysLoggedThisWeek: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-teal-700">{daysLoggedThisWeek} of 7 days logged this week</p>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-full ${
              i < daysLoggedThisWeek ? "bg-teal-500" : "bg-teal-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
