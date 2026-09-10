interface QuickAddItem {
  label: string;
  testId: string;
}

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { label: "Log Symptom", testId: "quick-add-symptom" },
  { label: "Log Mood", testId: "quick-add-mood" },
  { label: "Log Medication", testId: "quick-add-medication" },
  { label: "Log Habit", testId: "quick-add-habit" },
];

export function QuickAddGrid() {
  function handleQuickAdd() {
    // TODO(2.4): open the log-entry modal
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {QUICK_ADD_ITEMS.map((item) => (
        <button
          key={item.testId}
          type="button"
          data-testid={item.testId}
          onClick={handleQuickAdd}
          className="rounded-xl bg-teal-500 p-6 text-lg font-medium text-white shadow-sm hover:bg-teal-600"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
