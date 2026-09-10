import { describe, it, expect } from "vitest";
import { requireOwned } from "./ownership.js";
import { NotFoundError } from "./errors.js";

describe("requireOwned", () => {
  it("returns the record when it belongs to the given user", () => {
    const record = { id: "row-1", userId: "user-1" };

    expect(requireOwned(record, "user-1")).toBe(record);
  });

  it("throws NotFoundError when the record belongs to a different user", () => {
    const record = { id: "row-1", userId: "user-1" };

    expect(() => requireOwned(record, "user-2")).toThrow(NotFoundError);
  });

  it("throws NotFoundError when the record is null", () => {
    expect(() => requireOwned(null, "user-1")).toThrow(NotFoundError);
  });

  it("throws NotFoundError when the record is undefined", () => {
    expect(() => requireOwned(undefined, "user-1")).toThrow(NotFoundError);
  });
});
