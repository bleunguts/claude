import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validateQuery } from "./validateQuery.js";

const schema = z.object({
  limit: z.coerce.number().int().positive().optional(),
});

function appWithSchema() {
  const app = express();
  app.get("/test", validateQuery(schema), (req, res) => {
    res.status(200).json({ validatedQuery: req.validatedQuery });
  });
  return app;
}

describe("validateQuery", () => {
  it("attaches the parsed query and calls next for a valid query string", async () => {
    const res = await request(appWithSchema()).get("/test").query({ limit: "10" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ validatedQuery: { limit: 10 } });
  });

  it("returns 400 with validation details for an invalid query string", async () => {
    const res = await request(appWithSchema()).get("/test").query({ limit: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "limit" })]),
    );
  });
});
