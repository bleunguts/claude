import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/apiClient";
import type { Habit } from "../../types/api";
import type { LogFormProps, LogTypeAdapter } from "./types";

export interface HabitFormValues {
  habitId: string;
  valueBoolean: boolean | null;
  valueNumeric: number | null;
  valueDuration: number | null;
}

export function HabitForm({ value, onChange }: LogFormProps<HabitFormValues>): ReactElement {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["habits"],
    queryFn: () => apiFetch<{ habits: Habit[] }>("/habits"),
  });

  const activeHabits = (data?.habits ?? []).filter((habit) => habit.isActive);
  const selectedHabit = activeHabits.find((habit) => habit.id === value.habitId);

  function selectHabit(habit: Habit) {
    onChange({ habitId: habit.id, valueBoolean: null, valueNumeric: null, valueDuration: null });
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-teal-700">Habit</span>
        <div className="mt-1 max-h-48 space-y-2 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-teal-600">Loading habits…</p>}
          {isError && <p className="text-sm text-red-600">Couldn't load habits.</p>}
          {!isLoading && !isError && activeHabits.length === 0 && (
            <p className="text-sm text-teal-600">No habits yet — add one in Settings.</p>
          )}
          {activeHabits.map((habit) => {
            const isSelected = value.habitId === habit.id;
            return (
              <button
                key={habit.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectHabit(habit)}
                className={`w-full rounded-lg border p-3 text-left text-lg ${
                  isSelected
                    ? "border-teal-500 bg-teal-50 font-medium text-teal-800"
                    : "border-teal-200 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {habit.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedHabit?.trackingType === "boolean" && (
        <div>
          <span className="block text-teal-700">Completed?</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={value.valueBoolean === true}
              onClick={() => onChange({ ...value, valueBoolean: true })}
              className={`rounded-lg p-3 text-lg font-medium ${
                value.valueBoolean === true
                  ? "bg-teal-500 text-white"
                  : "bg-teal-50 text-teal-700 hover:bg-teal-100"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              aria-pressed={value.valueBoolean === false}
              onClick={() => onChange({ ...value, valueBoolean: false })}
              className={`rounded-lg p-3 text-lg font-medium ${
                value.valueBoolean === false
                  ? "bg-teal-500 text-white"
                  : "bg-teal-50 text-teal-700 hover:bg-teal-100"
              }`}
            >
              No
            </button>
          </div>
        </div>
      )}

      {selectedHabit?.trackingType === "numeric" && (
        <div>
          <label htmlFor="habit-value-numeric" className="block text-teal-700">
            {selectedHabit.unit ? `Amount (${selectedHabit.unit})` : "Amount"}
          </label>
          <input
            id="habit-value-numeric"
            type="number"
            value={value.valueNumeric ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                valueNumeric: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
        </div>
      )}

      {selectedHabit?.trackingType === "duration" && (
        <div>
          <label htmlFor="habit-value-duration" className="block text-teal-700">
            {selectedHabit.unit ?? "Duration (minutes)"}
          </label>
          <input
            id="habit-value-duration"
            type="number"
            value={value.valueDuration ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                valueDuration: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
        </div>
      )}
    </div>
  );
}

export const habitLogAdapter: LogTypeAdapter<HabitFormValues> = {
  initialValue: { habitId: "", valueBoolean: null, valueNumeric: null, valueDuration: null },
  isValid: (v) => {
    if (v.habitId === "") return false;
    return v.valueBoolean !== null || v.valueNumeric !== null || v.valueDuration !== null;
  },
  buildRequestBody: (v, shared) => {
    const body: Record<string, unknown> = {
      habitId: v.habitId,
      notes: shared.notes,
      loggedAt: shared.loggedAt,
    };
    if (v.valueBoolean !== null) body.valueBoolean = v.valueBoolean;
    if (v.valueNumeric !== null) body.valueNumeric = v.valueNumeric;
    if (v.valueDuration !== null) body.valueDuration = v.valueDuration;
    return body;
  },
  endpoint: "/habit-logs",
  invalidateQueryKeys: [["dashboard"]],
};
