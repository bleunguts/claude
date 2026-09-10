import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { HabitForm, habitLogAdapter, type HabitFormValues } from "./HabitForm";
import { apiFetch } from "../../lib/apiClient";
import type { Habit } from "../../types/api";

vi.mock("../../lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const HABITS: Habit[] = [
  {
    id: "hab-1",
    userId: "user-1",
    name: "Drink water",
    trackingType: "numeric",
    unit: "glasses",
    isActive: true,
  },
  {
    id: "hab-2",
    userId: "user-1",
    name: "Meditate",
    trackingType: "duration",
    unit: null,
    isActive: true,
  },
  {
    id: "hab-3",
    userId: "user-1",
    name: "Took a walk",
    trackingType: "boolean",
    unit: null,
    isActive: true,
  },
  {
    id: "hab-4",
    userId: "user-1",
    name: "Retired habit",
    trackingType: "boolean",
    unit: null,
    isActive: false,
  },
];

function initialValue(): HabitFormValues {
  return { habitId: "", valueBoolean: null, valueNumeric: null, valueDuration: null };
}

function renderForm(value: HabitFormValues = initialValue()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <HabitForm value={value} onChange={onChange} />
    </QueryClientProvider>,
  );
  return { ...utils, onChange };
}

describe("HabitForm", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue({ habits: HABITS });
  });

  it("renders only active habits", async () => {
    renderForm();

    expect(await screen.findByRole("button", { name: "Drink water" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Meditate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Took a walk" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retired habit" })).not.toBeInTheDocument();
  });

  it("selecting a boolean-type habit shows the boolean control and picking a value calls onChange correctly", async () => {
    const { onChange } = renderForm({
      habitId: "hab-3",
      valueBoolean: null,
      valueNumeric: null,
      valueDuration: null,
    });
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Took a walk" });

    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(onChange).toHaveBeenCalledWith({
      habitId: "hab-3",
      valueBoolean: true,
      valueNumeric: null,
      valueDuration: null,
    });
  });

  it("shows aria-pressed on the selected boolean value", async () => {
    renderForm({ habitId: "hab-3", valueBoolean: true, valueNumeric: null, valueDuration: null });

    expect(await screen.findByRole("button", { name: "Yes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "false");
  });

  it("selecting a numeric-type habit shows a number input labeled with its unit", async () => {
    const { onChange } = renderForm({
      habitId: "hab-1",
      valueBoolean: null,
      valueNumeric: null,
      valueDuration: null,
    });
    const user = userEvent.setup();

    const input = await screen.findByLabelText("Amount (glasses)");
    await user.type(input, "3");

    expect(onChange).toHaveBeenCalledWith({
      habitId: "hab-1",
      valueBoolean: null,
      valueNumeric: 3,
      valueDuration: null,
    });
  });

  it("selecting a duration-type habit shows a duration input", async () => {
    renderForm({ habitId: "hab-2", valueBoolean: null, valueNumeric: null, valueDuration: null });

    expect(await screen.findByLabelText("Duration (minutes)")).toBeInTheDocument();
  });

  it("does not render a value input until a habit is selected", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Drink water" });

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes" })).not.toBeInTheDocument();
  });

  it("switching from one habit to another resets the value fields to null", async () => {
    const { onChange } = renderForm({
      habitId: "hab-1",
      valueBoolean: null,
      valueNumeric: 3,
      valueDuration: null,
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Took a walk" }));

    expect(onChange).toHaveBeenCalledWith({
      habitId: "hab-3",
      valueBoolean: null,
      valueNumeric: null,
      valueDuration: null,
    });
  });
});

describe("habitLogAdapter", () => {
  it("is invalid until a habit is picked and a value is set", () => {
    expect(habitLogAdapter.isValid(initialValue())).toBe(false);
    expect(
      habitLogAdapter.isValid({
        habitId: "hab-1",
        valueBoolean: null,
        valueNumeric: null,
        valueDuration: null,
      }),
    ).toBe(false);
    expect(
      habitLogAdapter.isValid({
        habitId: "hab-1",
        valueBoolean: null,
        valueNumeric: 3,
        valueDuration: null,
      }),
    ).toBe(true);
    expect(
      habitLogAdapter.isValid({
        habitId: "hab-3",
        valueBoolean: false,
        valueNumeric: null,
        valueDuration: null,
      }),
    ).toBe(true);
  });

  it("builds a request body with only the relevant value field present, omitting the others entirely", () => {
    const body = habitLogAdapter.buildRequestBody(
      { habitId: "hab-1", valueBoolean: null, valueNumeric: 3, valueDuration: null },
      { notes: "felt good", loggedAt: "2026-01-01T00:00:00.000Z" },
    ) as Record<string, unknown>;

    expect(body).toEqual({
      habitId: "hab-1",
      notes: "felt good",
      loggedAt: "2026-01-01T00:00:00.000Z",
      valueNumeric: 3,
    });
    expect(body).not.toHaveProperty("valueBoolean");
    expect(body).not.toHaveProperty("valueDuration");
  });

  it("omits valueNumeric and valueDuration when a boolean value is set", () => {
    const body = habitLogAdapter.buildRequestBody(
      { habitId: "hab-3", valueBoolean: false, valueNumeric: null, valueDuration: null },
      { loggedAt: "2026-01-01T00:00:00.000Z" },
    ) as Record<string, unknown>;

    expect(body).toEqual({
      habitId: "hab-3",
      notes: undefined,
      loggedAt: "2026-01-01T00:00:00.000Z",
      valueBoolean: false,
    });
    expect(body).not.toHaveProperty("valueNumeric");
    expect(body).not.toHaveProperty("valueDuration");
  });

  it("omits valueBoolean and valueNumeric when a duration value is set", () => {
    const body = habitLogAdapter.buildRequestBody(
      { habitId: "hab-2", valueBoolean: null, valueNumeric: null, valueDuration: 20 },
      { loggedAt: "2026-01-01T00:00:00.000Z" },
    ) as Record<string, unknown>;

    expect(body).toEqual({
      habitId: "hab-2",
      notes: undefined,
      loggedAt: "2026-01-01T00:00:00.000Z",
      valueDuration: 20,
    });
    expect(body).not.toHaveProperty("valueBoolean");
    expect(body).not.toHaveProperty("valueNumeric");
  });
});
