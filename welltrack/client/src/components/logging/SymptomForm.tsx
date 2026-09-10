import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/apiClient";
import type { Symptom } from "../../types/api";
import type { LogFormProps, LogTypeAdapter } from "./types";

export interface SymptomFormValues {
  symptomId: string;
  severity: number;
}

const SEVERITY_LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);

export function SymptomForm({ value, onChange }: LogFormProps<SymptomFormValues>): ReactElement {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["symptoms"],
    queryFn: () => apiFetch<{ symptoms: Symptom[] }>("/symptoms"),
  });

  const activeSymptoms = useMemo(
    () => (data?.symptoms ?? []).filter((symptom) => symptom.isActive),
    [data],
  );

  const filteredSymptoms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeSymptoms;
    return activeSymptoms.filter((symptom) => symptom.name.toLowerCase().includes(query));
  }, [activeSymptoms, search]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="symptom-search" className="block text-teal-700">
          Symptom
        </label>
        <input
          id="symptom-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symptoms…"
          className="mt-1 w-full rounded-lg border border-teal-200 p-3"
        />

        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-teal-600">Loading symptoms…</p>}
          {isError && <p className="text-sm text-red-600">Couldn't load symptoms.</p>}
          {!isLoading && !isError && filteredSymptoms.length === 0 && (
            <p className="text-sm text-teal-600">No symptoms match &quot;{search}&quot;.</p>
          )}
          {filteredSymptoms.map((symptom) => {
            const isSelected = value.symptomId === symptom.id;
            return (
              <button
                key={symptom.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ ...value, symptomId: symptom.id })}
                className={`w-full rounded-lg border p-3 text-left text-lg ${
                  isSelected
                    ? "border-teal-500 bg-teal-50 font-medium text-teal-800"
                    : "border-teal-200 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {symptom.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-teal-700">Severity</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {SEVERITY_LEVELS.map((level) => {
            const isSelected = value.severity === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ ...value, severity: level })}
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-medium ${
                  isSelected
                    ? "bg-teal-500 text-white"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const symptomLogAdapter: LogTypeAdapter<SymptomFormValues> = {
  initialValue: { symptomId: "", severity: 5 },
  isValid: (v) => v.symptomId !== "",
  buildRequestBody: (v, shared) => ({
    symptomId: v.symptomId,
    severity: v.severity,
    notes: shared.notes,
    loggedAt: shared.loggedAt,
  }),
  endpoint: "/symptom-logs",
  invalidateQueryKeys: [["dashboard"]],
};
