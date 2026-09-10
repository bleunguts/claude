import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "../../lib/apiClient";
import type { LogType, LogTypeRegistry } from "./types";

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: LogType;
  registry: LogTypeRegistry;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function LogEntryModal({ isOpen, onClose, initialType, registry }: LogEntryModalProps) {
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [activeType, setActiveType] = useState<LogType>(initialType);
  const [values, setValues] = useState<Record<LogType, unknown>>(() =>
    buildInitialValues(registry),
  );
  const [notes, setNotes] = useState("");
  const [loggedAt, setLoggedAt] = useState(() => new Date());
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildInitialValues(reg: LogTypeRegistry): Record<LogType, unknown> {
    const entries = Object.entries(reg) as [LogType, LogTypeRegistry[LogType]][];
    return Object.fromEntries(
      entries.map(([type, entry]) => [type, entry.adapter.initialValue]),
    ) as Record<LogType, unknown>;
  }

  useEffect(() => {
    if (!isOpen) return;
    setActiveType(initialType);
    setValues(buildInitialValues(registry));
    setNotes("");
    setLoggedAt(new Date());
    setError(undefined);
  }, [isOpen, initialType, registry]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeEntry = registry[activeType];
  const ActiveForm = activeEntry.Form;
  const activeValue = values[activeType];
  const isBackfilled = !isSameCalendarDay(loggedAt, new Date());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);

    if (!activeEntry.adapter.isValid(activeValue)) {
      setError("Please complete the required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = activeEntry.adapter.buildRequestBody(activeValue, {
        notes: notes.trim() || undefined,
        loggedAt: loggedAt.toISOString(),
      });
      await apiFetch(activeEntry.adapter.endpoint, { method: "POST", body });
      for (const key of activeEntry.adapter.invalidateQueryKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-entry-modal-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="log-entry-modal-title" className="text-xl font-semibold text-teal-800">
            Add a log
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-teal-600 hover:bg-teal-50"
          >
            ✕
          </button>
        </div>

        <div role="tablist" aria-label="Log type" className="mb-4 grid grid-cols-4 gap-2">
          {(Object.keys(registry) as LogType[]).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={activeType === type}
              onClick={() => setActiveType(type)}
              className={`rounded-lg p-2 text-sm font-medium ${
                activeType === type
                  ? "bg-teal-500 text-white"
                  : "bg-teal-50 text-teal-700 hover:bg-teal-100"
              }`}
            >
              {registry[type].label}
            </button>
          ))}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <ActiveForm
            value={activeValue}
            onChange={(next) => setValues((prev) => ({ ...prev, [activeType]: next }))}
          />

          <div>
            <label htmlFor="log-entry-notes" className="block text-teal-700">
              Notes (optional)
            </label>
            <textarea
              id="log-entry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              className="mt-1 w-full rounded-lg border border-teal-200 p-3"
            />
          </div>

          <div>
            <label htmlFor="log-entry-datetime" className="block text-teal-700">
              Date &amp; time
            </label>
            <input
              id="log-entry-datetime"
              type="datetime-local"
              value={toDatetimeLocalValue(loggedAt)}
              max={toDatetimeLocalValue(new Date())}
              onChange={(e) => {
                if (e.target.value) setLoggedAt(new Date(e.target.value));
              }}
              className="mt-1 w-full rounded-lg border border-teal-200 p-3"
            />
            {isBackfilled && (
              <p className="mt-1 text-sm text-sage-700">
                Backfilling to a past date — this won't count toward today's log.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-teal-500 p-3 text-lg font-medium text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
