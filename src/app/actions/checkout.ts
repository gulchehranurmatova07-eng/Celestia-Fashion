"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { availablePaymentMethods, PAYMENT_PROVIDERS } from "@/lib/payments";
import { availableDeliveryMethods, DELIVERY_METHODS } from "@/lib/pricing";
import { placeOrder, StockError, type StockIssue } from "@/lib/orders";
import { COUNTRIES, UZ_REGIONS } from "@/lib/regions";
import { LOCALES } from "@/lib/constants";

export type CheckoutResult =
  | { ok: true; number: string; token: string }
  | { ok: false; error: "validation"; fields: Record<string, string> }
  | { ok: false; error: "stock"; issues: StockIssue[] }
  | { ok: false; error: "discount" | "method" | "payment" | "terms" | "generic" };

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^\+?\d{9,15}$/.test(s), "phone");

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone,
  country: z.enum(COUNTRIES),
  region: z.enum(UZ_REGIONS),
  city: z.string().trim().min(2).max(100),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  paymentMethod: z.enum(PAYMENT_PROVIDERS),
  discountCode: z.string().trim().max(40).optional(),
  terms: z.literal(true),
  saveAddress: z.boolean().optional(),
  locale: z.enum(LOCALES),
  lines: z.array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) })).min(1).max(100),
});

export type CheckoutPayload = z.input<typeof schema>;

export async function placeOrderAction(payload: CheckoutPayload): Promise<CheckoutResult> {
  if (payload?.terms !== true) return { ok: false, error: "terms" };
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fields[key]) fields[key] = key === "email" ? "email" : key === "phone" ? "phone" : "required";
    }
    return { ok: false, error: "validation", fields };
  }
  const data = parsed.data;
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  const methods = availableDeliveryMethods(settings);
  if (!methods.includes(data.deliveryMethod)) return { ok: false, error: "method" };
  if (data.deliveryMethod === "COURIER_TASHKENT" && data.region !== "TASHKENT_CITY") return { ok: false, error: "method" };
  if (!availablePaymentMethods(settings).includes(data.paymentMethod)) return { ok: false, error: "payment" };

  try {
    const order = await placeOrder(
      {
        userId: user?.id ?? null,
        locale: data.locale,
        email: data.email,
        phone: data.phone,
        fullName: data.fullName,
        country: data.country,
        region: data.region,
        city: data.city,
        line1: data.line1,
        line2: data.line2,
        postalCode: data.postalCode,
        notes: data.notes,
        deliveryMethod: data.deliveryMethod,
        paymentMethod: data.paymentMethod,
        discountCode: data.discountCode || undefined,
        lines: data.lines,
      },
      settings,
    );

    if (user && data.saveAddress) {
      const count = await db.address.count({ where: { userId: user.id } });
      await db.address.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          phone: data.phone,
          country: data.country,
          region: data.region,
          city: data.city,
          line1: data.line1,
          line2: data.line2 || null,
          postalCode: data.postalCode || null,
          isDefault: count === 0,
        },
      });
    }
    return { ok: true, number: order.number, token: order.accessToken };
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: "stock", issues: e.issues };
    if (e instanceof Error && e.message === "discount") return { ok: false, error: "discount" };
    console.error("[checkout]", e);
    return { ok: false, error: "generic" };
  }
}
