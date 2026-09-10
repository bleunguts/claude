import nodemailer from "nodemailer";
import { config } from "../config/index.js";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Reset your WellTrack password";
  const text = `We received a request to reset your WellTrack password. Reset it here: ${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;

  if (!config.SMTP_HOST) {
    console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: config.SMTP_FROM ?? "WellTrack <no-reply@welltrack.app>",
    to,
    subject,
    text,
  });
}
