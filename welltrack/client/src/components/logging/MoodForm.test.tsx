import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MoodForm, moodLogAdapter } from "./MoodForm";
import type { MoodFormValues } from "./MoodForm";

const baseValue: MoodFormValues = { moodScore: 3, energyLevel: null, stressLevel: null };

function renderForm(value: MoodFormValues, onChange = vi.fn()) {
  render(<MoodForm value={value} onChange={onChange} />);
  return { onChange };
}

describe("MoodForm", () => {
  it("calls onChange with the selected mood score", async () => {
    const { onChange } = renderForm(baseValue);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("mood-score-5"));

    expect(onChange).toHaveBeenCalledWith({ ...baseValue, moodScore: 5 });
  });

  it("marks the current mood score as pressed", () => {
    renderForm({ ...baseValue, moodScore: 4 });

    expect(screen.getByTestId("mood-score-4")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("mood-score-3")).toHaveAttribute("aria-pressed", "false");
  });

  it("starts with energy and stress selectors collapsed", () => {
    renderForm(baseValue);

    expect(screen.queryByTestId("energy-level-3")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stress-level-3")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add energy level" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "+ Add stress level" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reveals the energy selector when tapped and reports a selection", async () => {
    const { onChange } = renderForm(baseValue);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "+ Add energy level" }));
    expect(screen.getByTestId("energy-level-2")).toBeInTheDocument();

    await user.click(screen.getByTestId("energy-level-2"));

    expect(onChange).toHaveBeenCalledWith({ ...baseValue, energyLevel: 2 });
  });

  it("reveals the stress selector when tapped and reports a selection", async () => {
    const { onChange } = renderForm(baseValue);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "+ Add stress level" }));
    await user.click(screen.getByTestId("stress-level-4"));

    expect(onChange).toHaveBeenCalledWith({ ...baseValue, stressLevel: 4 });
  });

  it("collapses and clears energy level via the remove control", async () => {
    const { onChange } = renderForm({ ...baseValue, energyLevel: 3 });
    const user = userEvent.setup();

    expect(screen.getByTestId("energy-level-3")).toBeInTheDocument();
    const removeButton = screen.getByRole("button", { name: /remove energy level/i });
    expect(removeButton).toHaveAttribute("aria-expanded", "true");

    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith({ ...baseValue, energyLevel: null });
    expect(screen.queryByTestId("energy-level-3")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add energy level" })).toBeInTheDocument();
  });
});

describe("moodLogAdapter", () => {
  it("is valid only when moodScore is within 1-5", () => {
    expect(moodLogAdapter.isValid({ moodScore: 1, energyLevel: null, stressLevel: null })).toBe(
      true,
    );
    expect(moodLogAdapter.isValid({ moodScore: 5, energyLevel: null, stressLevel: null })).toBe(
      true,
    );
    expect(moodLogAdapter.isValid({ moodScore: 0, energyLevel: null, stressLevel: null })).toBe(
      false,
    );
    expect(moodLogAdapter.isValid({ moodScore: 6, energyLevel: null, stressLevel: null })).toBe(
      false,
    );
  });

  it("builds a request body with shared fields merged in", () => {
    const body = moodLogAdapter.buildRequestBody(
      { moodScore: 4, energyLevel: 2, stressLevel: 3 },
      { notes: "felt okay", loggedAt: "2026-09-11T10:00:00.000Z" },
    );

    expect(body).toEqual({
      moodScore: 4,
      energyLevel: 2,
      stressLevel: 3,
      notes: "felt okay",
      loggedAt: "2026-09-11T10:00:00.000Z",
    });
  });

  it("converts null energy and stress levels to undefined in the request body", () => {
    const body = moodLogAdapter.buildRequestBody(
      { moodScore: 3, energyLevel: null, stressLevel: null },
      { loggedAt: "2026-09-11T10:00:00.000Z" },
    ) as Record<string, unknown>;

    expect(body.energyLevel).toBeUndefined();
    expect(body.stressLevel).toBeUndefined();
    expect(Object.keys(body)).not.toContain("moodScoreLevel");
  });
});
