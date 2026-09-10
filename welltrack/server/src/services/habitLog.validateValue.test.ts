import { describe, it, expect } from "vitest";
import { validateHabitLogValue } from "./habitLog.service.js";
import { BadRequestError } from "../lib/errors.js";

describe("validateHabitLogValue", () => {
  describe("boolean tracking type", () => {
    it("accepts valueBoolean set and the others undefined", () => {
      expect(() => validateHabitLogValue("boolean", { valueBoolean: true })).not.toThrow();
      expect(() => validateHabitLogValue("boolean", { valueBoolean: false })).not.toThrow();
    });

    it("throws when valueBoolean is missing", () => {
      expect(() => validateHabitLogValue("boolean", {})).toThrow(BadRequestError);
    });

    it("throws when valueNumeric is also set", () => {
      expect(() =>
        validateHabitLogValue("boolean", { valueBoolean: true, valueNumeric: 5 }),
      ).toThrow(BadRequestError);
    });

    it("throws when valueDuration is also set", () => {
      expect(() =>
        validateHabitLogValue("boolean", { valueBoolean: true, valueDuration: 10 }),
      ).toThrow(BadRequestError);
    });

    it("throws when both other fields are also set", () => {
      expect(() =>
        validateHabitLogValue("boolean", {
          valueBoolean: true,
          valueNumeric: 5,
          valueDuration: 10,
        }),
      ).toThrow(BadRequestError);
    });

    it("throws when only a wrong field is set", () => {
      expect(() => validateHabitLogValue("boolean", { valueNumeric: 5 })).toThrow(BadRequestError);
    });

    it("uses the INVALID_HABIT_LOG_VALUE error code", () => {
      let caught: unknown;
      try {
        validateHabitLogValue("boolean", {});
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(BadRequestError);
      expect((caught as BadRequestError).code).toBe("INVALID_HABIT_LOG_VALUE");
      expect((caught as BadRequestError).statusCode).toBe(400);
    });
  });

  describe("numeric tracking type", () => {
    it("accepts valueNumeric set and the others undefined", () => {
      expect(() => validateHabitLogValue("numeric", { valueNumeric: 12.5 })).not.toThrow();
      expect(() => validateHabitLogValue("numeric", { valueNumeric: 0 })).not.toThrow();
    });

    it("throws when valueNumeric is missing", () => {
      expect(() => validateHabitLogValue("numeric", {})).toThrow(BadRequestError);
    });

    it("throws when valueBoolean is also set", () => {
      expect(() =>
        validateHabitLogValue("numeric", { valueNumeric: 5, valueBoolean: true }),
      ).toThrow(BadRequestError);
    });

    it("throws when valueDuration is also set", () => {
      expect(() =>
        validateHabitLogValue("numeric", { valueNumeric: 5, valueDuration: 10 }),
      ).toThrow(BadRequestError);
    });

    it("throws when only a wrong field is set", () => {
      expect(() => validateHabitLogValue("numeric", { valueDuration: 10 })).toThrow(
        BadRequestError,
      );
    });
  });

  describe("duration tracking type", () => {
    it("accepts valueDuration set and the others undefined", () => {
      expect(() => validateHabitLogValue("duration", { valueDuration: 30 })).not.toThrow();
      expect(() => validateHabitLogValue("duration", { valueDuration: 0 })).not.toThrow();
    });

    it("throws when valueDuration is missing", () => {
      expect(() => validateHabitLogValue("duration", {})).toThrow(BadRequestError);
    });

    it("throws when valueBoolean is also set", () => {
      expect(() =>
        validateHabitLogValue("duration", { valueDuration: 30, valueBoolean: true }),
      ).toThrow(BadRequestError);
    });

    it("throws when valueNumeric is also set", () => {
      expect(() =>
        validateHabitLogValue("duration", { valueDuration: 30, valueNumeric: 5 }),
      ).toThrow(BadRequestError);
    });

    it("throws when only a wrong field is set", () => {
      expect(() => validateHabitLogValue("duration", { valueBoolean: true })).toThrow(
        BadRequestError,
      );
    });

    it("throws when no fields are set at all", () => {
      expect(() => validateHabitLogValue("duration", {})).toThrow(BadRequestError);
    });
  });
});
