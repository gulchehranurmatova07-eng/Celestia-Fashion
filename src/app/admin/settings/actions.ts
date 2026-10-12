"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { saveSettings, type StoreSettings } from "@/lib/settings";
import { bool, handle, imageUrlSchema, intSchema, ok, refresh, str } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const text = (max = 300) => z.string().trim().max(max);
const localized = (max = 300) => z.object({ en: text(max), ru: text(max), uz: text(max) });
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//i.test(v), "Use a /path or an https:// URL");
const socialUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\//i.test(v), "Use a full https:// URL");

const schema = z.object({
  announcement: z.object({ enabled: z.boolean(), text: localized(200), href }),
  hero: z.object({
    title: localized(120),
    subtitle: localized(300),
    imageDesktop: z.array(imageUrlSchema.refine((v) => v !== "", "Image URL is required")).length(3),
    imageMobile: imageUrlSchema.refine((v) => v !== "", "Image URL is required"),
  }),
  shipping: z.object({
    courierTashkent: intSchema(0),
    courierRegions: intSchema(0),
    freeThreshold: intSchema(0),
    pickupEnabled: z.boolean(),
    pickupAddress: localized(300),
  }),
  payments: z.object({ cod: z.boolean(), click: z.boolean(), payme: z.boolean(), uzum: z.boolean() }),
  contact: z.object({
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    phone: text(40),
    address: localized(300),
    hours: localized(120),
  }),
  social: z.object({ instagram: socialUrl, telegram: socialUrl, facebook: socialUrl }),
});

const loc = (fd: FormData, prefix: string) => ({ en: str(fd, `${prefix}.en`), ru: str(fd, `${prefix}.ru`), uz: str(fd, `${prefix}.uz`) });

export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const parsed: StoreSettings = schema.parse({
      announcement: { enabled: bool(fd, "announcement.enabled"), text: loc(fd, "announcement.text"), href: str(fd, "announcement.href") },
      hero: {
        title: loc(fd, "hero.title"),
        subtitle: loc(fd, "hero.subtitle"),
        imageDesktop: [0, 1, 2].map((i) => str(fd, `hero.imageDesktop.${i}`)),
        imageMobile: str(fd, "hero.imageMobile"),
      },
      shipping: {
        courierTashkent: str(fd, "shipping.courierTashkent") || "0",
        courierRegions: str(fd, "shipping.courierRegions") || "0",
        freeThreshold: str(fd, "shipping.freeThreshold") || "0",
        pickupEnabled: bool(fd, "shipping.pickupEnabled"),
        pickupAddress: loc(fd, "shipping.pickupAddress"),
      },
      payments: {
        cod: bool(fd, "payments.cod"),
        click: bool(fd, "payments.click"),
        payme: bool(fd, "payments.payme"),
        uzum: bool(fd, "payments.uzum"),
      },
      contact: {
        email: str(fd, "contact.email"),
        phone: str(fd, "contact.phone"),
        address: loc(fd, "contact.address"),
        hours: loc(fd, "contact.hours"),
      },
      social: { instagram: str(fd, "social.instagram"), telegram: str(fd, "social.telegram"), facebook: str(fd, "social.facebook") },
    });
    await saveSettings(parsed);
    refresh("/admin/settings");
    const warn = !parsed.payments.cod && !parsed.payments.click && !parsed.payments.payme && !parsed.payments.uzum;
    return ok(warn ? "Settings saved — warning: no payment method is enabled, checkout will be unavailable." : "Settings saved.");
  });
}
