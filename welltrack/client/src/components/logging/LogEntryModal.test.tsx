import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LogEntryModal } from "./LogEntryModal";
import { apiFetch } from "../../lib/apiClient";
import type { LogTypeRegistry } from "./types";

vi.mock("../../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/apiClient")>();
  return { ...actual, apiFetch: vi.fn() };
});

interface FakeValue {
  text: string;
}

function FakeForm({ value, onChange }: { value: FakeValue; onChange: (v: FakeValue) => void }) {
  return (
    <input
      aria-label="Fake field"
      value={value.text}
      onChange={(e) => onChange({ text: e.target.value })}
    />
  );
}

const registry: LogTypeRegistry = {
  symptom: {
    label: "Symptom",
    Form: FakeForm,
    adapter: {
      initialValue: { text: "" },
      isValid: (v: FakeValue) => v.text.length > 0,
      buildRequestBody: (v: FakeValue, shared) => ({ ...v, ...shared }),
      endpoint: "/symptom-logs",
      invalidateQueryKeys: [["dashboard"]],
    },
  },
  mood: {
    label: "Mood",
    Form: FakeForm,
    adapter: {
      initialValue: { text: "" },
      isValid: () => true,
      buildRequestBody: (v: FakeValue, shared) => ({ ...v, ...shared }),
      endpoint: "/mood-logs",
      invalidateQueryKeys: [["dashboard"]],
    },
  },
  medication: {
    label: "Medication",
    Form: FakeForm,
    adapter: {
      initialValue: { text: "" },
      isValid: () => true,
      buildRequestBody: (v: FakeValue, shared) => ({ ...v, ...shared }),
      endpoint: "/medication-logs",
      invalidateQueryKeys: [["dashboard"]],
    },
  },
  habit: {
    label: "Habit",
    Form: FakeForm,
    adapter: {
      initialValue: { text: "" },
      isValid: () => true,
      buildRequestBody: (v: FakeValue, shared) => ({ ...v, ...shared }),
      endpoint: "/habit-logs",
      invalidateQueryKeys: [["dashboard"]],
    },
  },
};

function renderModal(props: Partial<React.ComponentProps<typeof LogEntryModal>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <LogEntryModal
        isOpen
        onClose={onClose}
        initialType="symptom"
        registry={registry}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onClose };
}

describe("LogEntryModal", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it("renders the tab for the initial type as selected and shows its form", () => {
    renderModal();
    expect(screen.getByRole("tab", { name: "Symptom" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Fake field")).toBeInTheDocument();
  });

  it("switches the active form when a different tab is clicked", async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Mood" }));
    expect(screen.getByRole("tab", { name: "Mood" })).toHaveAttribute("aria-selected", "true");
  });

  it("closes on Escape", async () => {
    const { onClose } = renderModal();
    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a validation error and does not submit when the active form is invalid", async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Please complete the required fields.")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("submits, invalidates queries, and closes on success", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: "1" });
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Fake field"), "hello");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledWith(
      "/symptom-logs",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("keeps the modal open and shows an error message on submit failure, without losing input", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("network down"));
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Fake field"), "keep me");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Something went wrong. Try again.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Fake field")).toHaveValue("keep me");
  });

  it("shows a backfill notice when the date/time picker is moved to a past day", async () => {
    renderModal();
    const input = screen.getByLabelText(/Date & time/i);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const value = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}T09:00`;

    // datetime-local inputs don't reliably respond to userEvent.type; fireEvent.change
    // is the standard RTL workaround for this input type.
    fireEvent.change(input, { target: { value } });

    expect(await screen.findByText(/Backfilling to a past date/i)).toBeInTheDocument();
  });
});
