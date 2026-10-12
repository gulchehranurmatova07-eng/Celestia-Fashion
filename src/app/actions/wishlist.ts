"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const ids = z.array(z.string().min(1).max(40)).max(200);

export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; saved?: boolean }> {
  const user = await getCurrentUser();
  if (!user || !z.string().min(1).max(40).safeParse(productId).success) return { ok: false };
  const where = { userId_productId: { userId: user.id, productId } };
  const existing = await db.wishlistItem.findUnique({ where });
  if (existing) {
    await db.wishlistItem.delete({ where });
    return { ok: true, saved: false };
  }
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false };
  await db.wishlistItem.create({ data: { userId: user.id, productId } });
  return { ok: true, saved: true };
}

/** Merges a guest's local wishlist into the account after sign-in. Returns the account's full list. */
export async function mergeWishlistAction(productIds: string[]): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const parsed = ids.safeParse(productIds);
  if (parsed.success && parsed.data.length) {
    const existing = await db.product.findMany({ where: { id: { in: parsed.data } }, select: { id: true } });
    for (const p of existing) {
      await db.wishlistItem.upsert({
        where: { userId_productId: { userId: user.id, productId: p.id } },
        update: {},
        create: { userId: user.id, productId: p.id },
      });
    }
  }
  const rows = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return rows.map((r) => r.productId);
}
