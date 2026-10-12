"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { evaluateDiscount } from "@/lib/pricing";

const lineSchema = z.array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) })).max(100);

export type DiscountCheck =
  | { ok: true; code: string; amount: number }
  | { ok: false; reason: "invalid" | "expired" | "minimum" | "exhausted"; minSubtotal?: number };

/** Validates a discount code against the server-side subtotal of the given lines. */
export async function checkDiscountAction(code: string, lines: { variantId: string; quantity: number }[]): Promise<DiscountCheck> {
  const parsed = lineSchema.safeParse(lines);
  if (!parsed.success || typeof code !== "string" || code.length > 40) return { ok: false, reason: "invalid" };
  const variants = await db.productVariant.findMany({
    where: { id: { in: parsed.data.map((l) => l.variantId) } },
    select: { id: true, product: { select: { price: true } } },
  });
  const price = new Map(variants.map((v) => [v.id, v.product.price]));
  const subtotal = parsed.data.reduce((s, l) => s + (price.get(l.variantId) ?? 0) * l.quantity, 0);
  return evaluateDiscount(code, subtotal);
}
