import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SymptomForm, symptomLogAdapter, type SymptomFormValues } from "./SymptomForm";
import { apiFetch } from "../../lib/apiClient";
import type { Symptom } from "../../types/api";

vi.mock("../../lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const SYMPTOMS: Symptom[] = [
  { id: "sym-1", userId: "user-1", name: "Headache", category: "pain", isActive: true },
  { id: "sym-2", userId: "user-1", name: "Nausea", category: "digestive", isActive: true },
  { id: "sym-3", userId: "user-1", name: "Retired Symptom", category: "other", isActive: false },
];

function renderForm(value: SymptomFormValues = { symptomId: "", severity: 5 }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <SymptomForm value={value} onChange={onChange} />
    </QueryClientProvider>,
  );
  return { ...utils, onChange };
}

describe("SymptomForm", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue({ symptoms: SYMPTOMS });
  });

  it("renders only active symptoms", async () => {
    renderForm();

    expect(await screen.findByRole("button", { name: "Headache" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nausea" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retired Symptom" })).not.toBeInTheDocument();
  });

  it("filters the list when typing in the search field", async () => {
    renderForm();
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Headache" });

    await user.type(screen.getByLabelText("Symptom"), "Naus");

    expect(screen.queryByRole("button", { name: "Headache" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nausea" })).toBeInTheDocument();
  });

  it("calls onChange with the symptomId when a symptom is clicked", async () => {
    const { onChange } = renderForm();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Headache" }));

    expect(onChange).toHaveBeenCalledWith({ symptomId: "sym-1", severity: 5 });
  });

  it("calls onChange with the severity when a severity number is clicked", async () => {
    const { onChange } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "8" }));

    expect(onChange).toHaveBeenCalledWith({ symptomId: "", severity: 8 });
  });
});

describe("symptomLogAdapter", () => {
  it("is invalid until a symptom is picked", () => {
    expect(symptomLogAdapter.isValid({ symptomId: "", severity: 5 })).toBe(false);
    expect(symptomLogAdapter.isValid({ symptomId: "sym-1", severity: 5 })).toBe(true);
  });

  it("builds the request body from the value and shared fields", () => {
    const body = symptomLogAdapter.buildRequestBody(
      { symptomId: "sym-1", severity: 7 },
      { notes: "felt bad", loggedAt: "2026-01-01T00:00:00.000Z" },
    );

    expect(body).toEqual({
      symptomId: "sym-1",
      severity: 7,
      notes: "felt bad",
      loggedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
