import type { LogType } from "../logging/types";

interface QuickAddItem {
  type: LogType;
  label: string;
  testId: string;
}

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { type: "symptom", label: "Log Symptom", testId: "quick-add-symptom" },
  { type: "mood", label: "Log Mood", testId: "quick-add-mood" },
  { type: "medication", label: "Log Medication", testId: "quick-add-medication" },
  { type: "habit", label: "Log Habit", testId: "quick-add-habit" },
];

export function QuickAddGrid({ onSelect }: { onSelect: (type: LogType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {QUICK_ADD_ITEMS.map((item) => (
        <button
          key={item.testId}
          type="button"
          data-testid={item.testId}
          onClick={() => onSelect(item.type)}
          className="rounded-xl bg-teal-500 p-6 text-lg font-medium text-white shadow-sm hover:bg-teal-600"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
