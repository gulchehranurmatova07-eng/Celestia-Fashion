"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { LOCALES } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

export type NewsletterState = { status: "idle" | "success" | "already" | "invalid" | "consent" | "error"; email?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  consent: z.literal("on"),
  locale: z.enum(LOCALES),
});

export async function subscribeAction(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  if (form.get("website")) return { status: "success" }; // honeypot
  const raw = { email: form.get("email"), consent: form.get("consent"), locale: form.get("locale") || "en" };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: field === "consent" ? "consent" : "invalid", email: String(raw.email ?? "") };
  }
  const { email, locale } = parsed.data;
  try {
    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (existing?.status === "SUBSCRIBED") return { status: "already" };
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { status: "SUBSCRIBED", consent: true, locale },
      create: { email, locale, consent: true },
    });
    await sendEmail(email, "Welcome to CELESTIA", "Thank you for subscribing to CELESTIA. You will receive collection previews, exclusive offers and inspiration.\n\nYou can unsubscribe at any time by replying to this email.");
    return { status: "success" };
  } catch (e) {
    console.error("[newsletter]", e);
    return { status: "error" };
  }
}
