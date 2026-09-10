import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("shows inline validation errors when submitted empty", async () => {
    renderWithProviders(<LoginPage />, { route: "/login" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });
});
