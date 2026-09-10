import { useState } from "react";
import type { ReactElement } from "react";
import type { LogFormProps, LogTypeAdapter } from "./types";

export interface MoodFormValues {
  moodScore: number;
  energyLevel: number | null;
  stressLevel: number | null;
}

const MOOD_LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

interface ScaleSelectorProps {
  legend: string;
  value: number | null;
  onSelect: (n: number) => void;
  idPrefix: string;
}

function ScaleSelector({ legend, value, onSelect, idPrefix }: ScaleSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-teal-700">{legend}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            data-testid={`${idPrefix}-${n}`}
            aria-pressed={value === n}
            onClick={() => onSelect(n)}
            className={`flex flex-col items-center rounded-lg p-3 text-lg font-medium ${
              value === n ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-100"
            }`}
          >
            <span>{n}</span>
            <span className="text-sm font-normal">{MOOD_LABELS[n]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface CollapsibleScaleRowProps {
  label: string;
  legend: string;
  value: number | null;
  onChange: (n: number | null) => void;
  idPrefix: string;
}

function CollapsibleScaleRow({
  label,
  legend,
  value,
  onChange,
  idPrefix,
}: CollapsibleScaleRowProps) {
  const [isExpanded, setIsExpanded] = useState(value !== null);

  if (!isExpanded) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => setIsExpanded(true)}
        className="rounded-lg bg-teal-50 px-4 py-2 text-teal-700 hover:bg-teal-100"
      >
        + {label}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={true}
        onClick={() => {
          onChange(null);
          setIsExpanded(false);
        }}
        className="text-sm text-teal-600 hover:underline"
      >
        Remove {legend.toLowerCase()}
      </button>
      <ScaleSelector
        legend={legend}
        value={value}
        onSelect={(n) => onChange(n)}
        idPrefix={idPrefix}
      />
    </div>
  );
}

export function MoodForm({ value, onChange }: LogFormProps<MoodFormValues>): ReactElement {
  return (
    <div className="space-y-4">
      <ScaleSelector
        legend="How are you feeling?"
        value={value.moodScore}
        onSelect={(n) => onChange({ ...value, moodScore: n })}
        idPrefix="mood-score"
      />

      <CollapsibleScaleRow
        label="Add energy level"
        legend="Energy level"
        value={value.energyLevel}
        onChange={(n) => onChange({ ...value, energyLevel: n })}
        idPrefix="energy-level"
      />

      <CollapsibleScaleRow
        label="Add stress level"
        legend="Stress level"
        value={value.stressLevel}
        onChange={(n) => onChange({ ...value, stressLevel: n })}
        idPrefix="stress-level"
      />
    </div>
  );
}

export const moodLogAdapter: LogTypeAdapter<MoodFormValues> = {
  initialValue: { moodScore: 3, energyLevel: null, stressLevel: null },
  isValid: (v) => v.moodScore >= 1 && v.moodScore <= 5,
  buildRequestBody: (v, shared) => ({
    moodScore: v.moodScore,
    energyLevel: v.energyLevel ?? undefined,
    stressLevel: v.stressLevel ?? undefined,
    notes: shared.notes,
    loggedAt: shared.loggedAt,
  }),
  endpoint: "/mood-logs",
  invalidateQueryKeys: [["dashboard"]],
};
