import "server-only";
import { db } from "./db";

/**
 * Sends a transactional email. Without SMTP configuration the message is kept in
 * the development outbox (Admin → Outbox) and logged — it is NOT delivered.
 */
export async function sendEmail(to: string, subject: string, body: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(`[email:dev-outbox] to=${to} subject="${subject}"\n${body}`);
    await db.emailOutbox.create({ data: { to, subject, body, delivered: false } });
    return { delivered: false };
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body });
    await db.emailOutbox.create({ data: { to, subject, body, delivered: true } });
    return { delivered: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[email] delivery failed", error);
    await db.emailOutbox.create({ data: { to, subject, body, delivered: false, error } });
    return { delivered: false };
  }
}

export function siteUrl(path = "") {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
