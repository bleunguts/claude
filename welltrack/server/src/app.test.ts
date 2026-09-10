import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { config } from "./config/index.js";

describe("CORS", () => {
  it("allows the configured client origin on a preflight request", async () => {
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", config.CLIENT_URL)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(config.CLIENT_URL);
  });

  it("does not reflect an arbitrary request origin back", async () => {
    // With a static configured origin, cors() always emits the configured value (never
    // echoes the request's Origin) — it's the browser's job to reject the mismatch.
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", "http://evil.example.com")
      .set("Access-Control-Request-Method", "POST");

    expect(res.headers["access-control-allow-origin"]).toBe(config.CLIENT_URL);
    expect(res.headers["access-control-allow-origin"]).not.toBe("http://evil.example.com");
  });
});
