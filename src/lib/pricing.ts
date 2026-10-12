import "server-only";
import { db } from "./db";
import type { StoreSettings } from "./settings";

export const DELIVERY_METHODS = ["COURIER_TASHKENT", "COURIER_REGIONS", "PICKUP"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export function availableDeliveryMethods(settings: StoreSettings): DeliveryMethod[] {
  const out: DeliveryMethod[] = ["COURIER_TASHKENT", "COURIER_REGIONS"];
  if (settings.shipping.pickupEnabled) out.push("PICKUP");
  return out;
}

export function shippingCost(method: DeliveryMethod, subtotalAfterDiscount: number, settings: StoreSettings) {
  if (method === "PICKUP") return 0;
  const { freeThreshold } = settings.shipping;
  if (freeThreshold > 0 && subtotalAfterDiscount >= freeThreshold) return 0;
  return method === "COURIER_TASHKENT" ? settings.shipping.courierTashkent : settings.shipping.courierRegions;
}

export type DiscountResult =
  | { ok: true; code: string; amount: number }
  | { ok: false; reason: "invalid" | "expired" | "minimum" | "exhausted"; minSubtotal?: number };

export async function evaluateDiscount(rawCode: string, subtotal: number): Promise<DiscountResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "invalid" };
  const d = await db.discountCode.findUnique({ where: { code } });
  if (!d || !d.active) return { ok: false, reason: "invalid" };
  const now = new Date();
  if ((d.startsAt && d.startsAt > now) || (d.endsAt && d.endsAt < now)) return { ok: false, reason: "expired" };
  if (d.maxUses != null && d.usedCount >= d.maxUses) return { ok: false, reason: "exhausted" };
  if (subtotal < d.minSubtotal) return { ok: false, reason: "minimum", minSubtotal: d.minSubtotal };
  const amount = d.type === "PERCENT" ? Math.round((subtotal * Math.min(d.value, 100)) / 100) : Math.min(d.value, subtotal);
  return { ok: true, code, amount };
}
