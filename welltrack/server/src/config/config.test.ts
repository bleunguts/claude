import { describe, it, expect } from "vitest";
import { loadConfig } from "./index.js";

const requiredEnv = {
  DATABASE_URL: "postgresql://welltrack:welltrack_dev_password@localhost:5432/welltrack",
  CLIENT_URL: "http://localhost:5173",
  JWT_ACCESS_SECRET: "access-secret",
  JWT_REFRESH_SECRET: "refresh-secret",
};

describe("loadConfig", () => {
  it("throws naming every missing required var", () => {
    expect(() => loadConfig({})).toThrowError(
      /DATABASE_URL[\s\S]*CLIENT_URL[\s\S]*JWT_ACCESS_SECRET[\s\S]*JWT_REFRESH_SECRET/,
    );
  });

  it("parses successfully when all required vars are present", () => {
    const config = loadConfig(requiredEnv);
    expect(config.DATABASE_URL).toBe(requiredEnv.DATABASE_URL);
    expect(config.CLIENT_URL).toBe(requiredEnv.CLIENT_URL);
    expect(config.JWT_ACCESS_SECRET).toBe(requiredEnv.JWT_ACCESS_SECRET);
    expect(config.JWT_REFRESH_SECRET).toBe(requiredEnv.JWT_REFRESH_SECRET);
  });

  it("applies documented defaults for omitted optional vars", () => {
    const config = loadConfig(requiredEnv);
    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe("development");
    expect(config.JWT_ACCESS_TTL).toBe("15m");
    expect(config.JWT_REFRESH_TTL).toBe("30d");
    expect(config.PASSWORD_RESET_TOKEN_TTL).toBe("1h");
  });

  it("lets explicit optional values override the defaults", () => {
    const config = loadConfig({
      ...requiredEnv,
      PORT: "4000",
      NODE_ENV: "production",
      JWT_ACCESS_TTL: "5m",
      JWT_REFRESH_TTL: "7d",
      PASSWORD_RESET_TOKEN_TTL: "30m",
    });
    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe("production");
    expect(config.JWT_ACCESS_TTL).toBe("5m");
    expect(config.JWT_REFRESH_TTL).toBe("7d");
    expect(config.PASSWORD_RESET_TOKEN_TTL).toBe("30m");
  });

  it("treats an empty SMTP_PORT as undefined rather than 0", () => {
    const config = loadConfig({ ...requiredEnv, SMTP_PORT: "" });
    expect(config.SMTP_PORT).toBeUndefined();
  });

  it("parses a real SMTP_PORT value", () => {
    const config = loadConfig({ ...requiredEnv, SMTP_PORT: "587" });
    expect(config.SMTP_PORT).toBe(587);
  });
});
