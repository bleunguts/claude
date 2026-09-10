import { describe, it, expect } from "vitest";
import { hash, compare } from "./passwordService.js";

describe("passwordService", () => {
  it("hashes a password into a bcrypt-formatted string distinct from the plaintext", async () => {
    const hashed = await hash("correct-horse-battery-1");

    expect(hashed).not.toBe("correct-horse-battery-1");
    expect(hashed).toMatch(/^\$2[aby]\$12\$/);
  });

  it("produces a different hash each time due to salting", async () => {
    const first = await hash("correct-horse-battery-1");
    const second = await hash("correct-horse-battery-1");

    expect(first).not.toBe(second);
  });

  it("compare() resolves true for the correct password", async () => {
    const hashed = await hash("correct-horse-battery-1");

    await expect(compare("correct-horse-battery-1", hashed)).resolves.toBe(true);
  });

  it("compare() resolves false for an incorrect password", async () => {
    const hashed = await hash("correct-horse-battery-1");

    await expect(compare("wrong-password-1", hashed)).resolves.toBe(false);
  });
});
