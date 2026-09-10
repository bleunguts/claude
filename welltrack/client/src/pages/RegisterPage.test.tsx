import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { RegisterPage } from "./RegisterPage";
import { ApiError } from "../lib/apiClient";
import { registerRequest } from "../lib/authApi";

vi.mock("../lib/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/authApi")>();
  return { ...actual, registerRequest: vi.fn() };
});

describe("RegisterPage", () => {
  it("shows a clear duplicate-email error when the server rejects the address", async () => {
    vi.mocked(registerRequest).mockRejectedValueOnce(
      new ApiError(409, "EMAIL_IN_USE", "Email is already registered"),
    );

    renderWithProviders(<RegisterPage />, { route: "/register" });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Display name"), "Sarah");
    await user.type(screen.getByLabelText("Email"), "sarah@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });
});
