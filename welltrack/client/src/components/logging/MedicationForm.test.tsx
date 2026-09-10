import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MedicationForm, medicationLogAdapter, type MedicationFormValues } from "./MedicationForm";
import { apiFetch } from "../../lib/apiClient";
import type { Medication } from "../../types/api";

vi.mock("../../lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const MEDICATIONS: Medication[] = [
  {
    id: "med-1",
    userId: "user-1",
    name: "Ibuprofen",
    dosage: "200mg",
    frequency: "as needed",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "med-2",
    userId: "user-1",
    name: "Vitamin D",
    dosage: null,
    frequency: "daily",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "med-3",
    userId: "user-1",
    name: "Retired Medication",
    dosage: "50mg",
    frequency: "daily",
    isActive: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function renderForm(value: MedicationFormValues = { medicationId: "", taken: true }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MedicationForm value={value} onChange={onChange} />
    </QueryClientProvider>,
  );
  return { ...utils, onChange };
}

describe("MedicationForm", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue({ medications: MEDICATIONS });
  });

  it("renders only active medications, showing dosage when present", async () => {
    renderForm();

    expect(await screen.findByRole("button", { name: /Ibuprofen/ })).toBeInTheDocument();
    expect(screen.getByText("200mg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vitamin D/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retired Medication/ })).not.toBeInTheDocument();
  });

  it("calls onChange with the medicationId when a medication is clicked", async () => {
    const { onChange } = renderForm();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Ibuprofen/ }));

    expect(onChange).toHaveBeenCalledWith({ medicationId: "med-1", taken: true });
  });

  it("toggles taken/not-taken and calls onChange with the right value for each", async () => {
    const { onChange } = renderForm({ medicationId: "med-1", taken: true });
    const user = userEvent.setup();
    await screen.findByRole("button", { name: /Ibuprofen/ });

    await user.click(screen.getByRole("button", { name: "Not taken" }));
    expect(onChange).toHaveBeenCalledWith({ medicationId: "med-1", taken: false });

    await user.click(screen.getByRole("button", { name: "Taken" }));
    expect(onChange).toHaveBeenCalledWith({ medicationId: "med-1", taken: true });
  });

  it("marks the selected medication and taken state with aria-pressed", async () => {
    renderForm({ medicationId: "med-1", taken: false });

    expect(await screen.findByRole("button", { name: /Ibuprofen/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Vitamin D/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Taken" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Not taken" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a friendly message when there are no medications", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ medications: [] });
    renderForm();

    expect(await screen.findByText(/No medications yet/i)).toBeInTheDocument();
  });
});

describe("medicationLogAdapter", () => {
  it("is invalid until a medication is picked", () => {
    expect(medicationLogAdapter.isValid({ medicationId: "", taken: true })).toBe(false);
    expect(medicationLogAdapter.isValid({ medicationId: "med-1", taken: true })).toBe(true);
  });

  it("builds the request body, mapping shared.loggedAt onto takenAt (not loggedAt)", () => {
    const body = medicationLogAdapter.buildRequestBody(
      { medicationId: "med-1", taken: false },
      { notes: "skipped dose", loggedAt: "2026-01-01T00:00:00.000Z" },
    );

    expect(body).toEqual({
      medicationId: "med-1",
      taken: false,
      takenAt: "2026-01-01T00:00:00.000Z",
      notes: "skipped dose",
    });
    expect(body).not.toHaveProperty("loggedAt");
  });
});
