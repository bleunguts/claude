import type { ReactElement } from "react";

export type LogType = "symptom" | "mood" | "medication" | "habit";

export interface SharedLogFields {
  notes?: string;
  loggedAt: string; // ISO 8601 UTC instant, from the shared date/time picker
}

export interface LogFormProps<TValue> {
  value: TValue;
  onChange: (value: TValue) => void;
}

export interface LogTypeAdapter<TValue> {
  initialValue: TValue;
  isValid: (value: TValue) => boolean;
  buildRequestBody: (value: TValue, shared: SharedLogFields) => unknown;
  endpoint: string;
  invalidateQueryKeys: unknown[][];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LogTypeEntry<TValue = any> {
  label: string;
  Form: (props: LogFormProps<TValue>) => ReactElement;
  adapter: LogTypeAdapter<TValue>;
}

export type LogTypeRegistry = Record<LogType, LogTypeEntry>;
