import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "./errorHandler.js";
import { NotFoundError } from "../lib/errors.js";

function appWithRoute(handler: express.RequestHandler) {
  const app = express();
  app.get("/test", handler);
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps an AppError to its statusCode, code, and message", async () => {
    const app = appWithRoute((_req, _res, next) => {
      next(new NotFoundError("Resource not found"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Resource not found" } });
  });

  it("maps an unknown error to a generic 500 without leaking its message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = appWithRoute((_req, _res, next) => {
      next(new Error("some internal detail"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
  });
});
