"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, hashPassword, hashToken, randomToken, verifyPassword } from "@/lib/auth";
import { sendEmail, siteUrl } from "@/lib/email";
import { LOCALES } from "@/lib/constants";

export type FormState = { error?: string; fields?: Record<string, string>; success?: string; values?: Record<string, string> };

// Echo non-secret fields back so forms keep their values after a failed submit (React resets forms after actions).
function keep(form: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

const email = z.string().trim().toLowerCase().email().max(200);
const password = z.string().min(8).max(200);

function localePath(locale: string, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

/** Only allow same-site relative redirects. */
function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : null;
}

let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword(randomToken()));

// Simple in-memory throttle for credential endpoints (per process).
const attempts = new Map<string, { n: number; until: number }>();
function throttled(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.until > now && a.n >= 8) return true;
  attempts.set(key, a && a.until > now ? { n: a.n + 1, until: a.until } : { n: 1, until: now + 15 * 60 * 1000 });
  return false;
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1).max(200) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "invalid", values: keep(form, ["email"]) };
  if (throttled(`login:${parsed.data.email}`)) return { error: "invalid", values: keep(form, ["email"]) };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Always run bcrypt to keep response time similar for unknown emails.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) return { error: "invalid", values: keep(form, ["email"]) };
  attempts.delete(`login:${parsed.data.email}`);
  await createSession(user.id);
  const locale = LOCALES.includes(user.locale as never) ? user.locale : await getLocale();
  redirect(safeNext(form.get("next")) ?? localePath(locale, "/account"));
}

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    email,
    phone: z.string().trim().max(30).optional(),
    password,
    confirm: z.string(),
  });
  const parsed = schema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") || undefined,
    password: form.get("password"),
    confirm: form.get("confirm"),
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] = i.path[0] === "password" ? "weak" : "required";
    return { fields, values: keep(form, ["name", "email", "phone"]) };
  }
  if (parsed.data.password !== parsed.data.confirm) return { fields: { confirm: "mismatch" }, values: keep(form, ["name", "email", "phone"]) };
  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { fields: { email: "exists" }, values: keep(form, ["name", "email", "phone"]) };
  const locale = await getLocale();
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      locale,
    },
  });
  if (form.get("newsletter") === "on") {
    await db.newsletterSubscriber.upsert({
      where: { email: user.email },
      update: { status: "SUBSCRIBED", consent: true },
      create: { email: user.email, locale, consent: true, source: "register" },
    });
  }
  await createSession(user.id);
  redirect(safeNext(form.get("next")) ?? localePath(locale, "/account"));
}

export async function logoutAction() {
  const locale = await getLocale();
  await destroySession();
  redirect(localePath(locale, "/"));
}

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { fields: { email: "required" } };
  const locale = await getLocale();
  if (!throttled(`reset:${parsed.data}`)) {
    const user = await db.user.findUnique({ where: { email: parsed.data } });
    if (user) {
      const token = randomToken();
      await db.passwordResetToken.create({ data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
      const link = siteUrl(localePath(locale, `/reset-password?token=${token}`));
      await sendEmail(user.email, "CELESTIA — reset your password", `We received a request to reset your password.\n\nChoose a new password: ${link}\n\nThis link is valid for one hour. If you did not request it, you can ignore this email.`);
    }
  }
  // Same response whether or not the account exists.
  return { success: "sent" };
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const pw = password.safeParse(form.get("password"));
  if (!pw.success) return { fields: { password: "weak" } };
  if (pw.data !== form.get("confirm")) return { fields: { confirm: "mismatch" } };
  const row = await db.passwordResetToken.findUnique({ where: { id: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return { error: "invalid" };
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(pw.data) } }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: row.userId } }), // sign out everywhere
  ]);
  return { success: "reset" };
}

/* ----------------------------- Account ----------------------------- */

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" };
  const parsed = z
    .object({ name: z.string().trim().min(2).max(120), email, phone: z.string().trim().max(30).optional(), locale: z.enum(LOCALES) })
    .safeParse({ name: form.get("name"), email: form.get("email"), phone: form.get("phone") || undefined, locale: form.get("locale") });
  if (!parsed.success) return { fields: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), "required"])) };
  if (parsed.data.email !== user.email && (await db.user.findUnique({ where: { email: parsed.data.email } }))) {
    return { fields: { email: "taken" } };
  }
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, phone: parsed.data.phone || null } });
  revalidatePath("/", "layout");
  return { success: "saved" };
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" };
  const full = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(String(form.get("current") ?? ""), full.passwordHash))) return { fields: { current: "wrong" } };
  const pw = password.safeParse(form.get("password"));
  if (!pw.success) return { fields: { password: "weak" } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw.data) } });
  return { success: "password" };
}
