import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/apiClient";
import type { Medication } from "../../types/api";
import type { LogFormProps, LogTypeAdapter } from "./types";

export interface MedicationFormValues {
  medicationId: string;
  taken: boolean;
}

export function MedicationForm({
  value,
  onChange,
}: LogFormProps<MedicationFormValues>): ReactElement {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["medications"],
    queryFn: () => apiFetch<{ medications: Medication[] }>("/medications"),
  });

  const activeMedications = (data?.medications ?? []).filter((medication) => medication.isActive);

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-teal-700">Medication</span>
        <div className="mt-1 max-h-48 space-y-2 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-teal-600">Loading medications…</p>}
          {isError && <p className="text-sm text-red-600">Couldn't load medications.</p>}
          {!isLoading && !isError && activeMedications.length === 0 && (
            <p className="text-sm text-teal-600">No medications yet — add one in Settings.</p>
          )}
          {activeMedications.map((medication) => {
            const isSelected = value.medicationId === medication.id;
            return (
              <button
                key={medication.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ ...value, medicationId: medication.id })}
                className={`w-full rounded-lg border p-3 text-left text-lg ${
                  isSelected
                    ? "border-teal-500 bg-teal-50 font-medium text-teal-800"
                    : "border-teal-200 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {medication.name}
                {medication.dosage && (
                  <span className="block text-sm font-normal text-teal-600">
                    {medication.dosage}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-teal-700">Taken?</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={value.taken}
            onClick={() => onChange({ ...value, taken: true })}
            className={`rounded-lg p-3 text-lg font-medium ${
              value.taken ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-100"
            }`}
          >
            Taken
          </button>
          <button
            type="button"
            aria-pressed={!value.taken}
            onClick={() => onChange({ ...value, taken: false })}
            className={`rounded-lg p-3 text-lg font-medium ${
              !value.taken ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-100"
            }`}
          >
            Not taken
          </button>
        </div>
      </div>
    </div>
  );
}

export const medicationLogAdapter: LogTypeAdapter<MedicationFormValues> = {
  initialValue: { medicationId: "", taken: true },
  isValid: (v) => v.medicationId !== "",
  buildRequestBody: (v, shared) => ({
    medicationId: v.medicationId,
    taken: v.taken,
    takenAt: shared.loggedAt,
    notes: shared.notes,
  }),
  endpoint: "/medication-logs",
  invalidateQueryKeys: [["dashboard"]],
};
