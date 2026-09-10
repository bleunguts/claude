import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendMail, createTransport } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

vi.mock("../config/index.js", () => ({
  config: {
    SMTP_HOST: undefined as string | undefined,
    SMTP_PORT: undefined as number | undefined,
    SMTP_USER: undefined as string | undefined,
    SMTP_PASS: undefined as string | undefined,
    SMTP_FROM: undefined as string | undefined,
  },
}));

import { config } from "../config/index.js";
import { sendPasswordResetEmail } from "./emailService.js";

describe("emailService.sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createTransport.mockReturnValue({ sendMail });
    config.SMTP_HOST = undefined;
    config.SMTP_PORT = undefined;
    config.SMTP_USER = undefined;
    config.SMTP_PASS = undefined;
    config.SMTP_FROM = undefined;
  });

  it("logs to the console and does not create a transport when SMTP is not configured", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await sendPasswordResetEmail("user@example.com", "https://app.example.com/reset?token=abc");

    expect(createTransport).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("user@example.com"));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://app.example.com/reset?token=abc"),
    );
  });

  it("sends via SMTP transport when SMTP is configured", async () => {
    config.SMTP_HOST = "smtp.example.com";
    config.SMTP_PORT = 587;
    config.SMTP_USER = "smtp-user";
    config.SMTP_PASS = "smtp-pass";
    config.SMTP_FROM = "WellTrack <no-reply@welltrack.app>";

    await sendPasswordResetEmail("user@example.com", "https://app.example.com/reset?token=abc");

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      auth: { user: "smtp-user", pass: "smtp-pass" },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "WellTrack <no-reply@welltrack.app>",
        to: "user@example.com",
        subject: expect.any(String),
      }),
    );
  });
});
