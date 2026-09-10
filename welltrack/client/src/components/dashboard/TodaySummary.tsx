interface TodayCounts {
  symptom: number;
  mood: number;
  medication: number;
  habit: number;
}

const LABELS: { key: keyof TodayCounts; label: string }[] = [
  { key: "symptom", label: "Symptoms" },
  { key: "mood", label: "Mood" },
  { key: "medication", label: "Medications" },
  { key: "habit", label: "Habits" },
];

export function TodaySummary({ todayCounts }: { todayCounts: TodayCounts }) {
  const total = LABELS.reduce((sum, { key }) => sum + todayCounts[key], 0);

  if (total === 0) {
    return (
      <div className="rounded-xl bg-sage-50 p-6 text-sage-800">
        Nothing logged yet today — tap a button below to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LABELS.map(({ key, label }) => (
        <div key={key} className="rounded-xl bg-white p-4 text-center shadow-sm">
          <div className="text-3xl font-semibold text-teal-700">{todayCounts[key]}</div>
          <div className="text-teal-600">{label}</div>
        </div>
      ))}
    </div>
  );
}
