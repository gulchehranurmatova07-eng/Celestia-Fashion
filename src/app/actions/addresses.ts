"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UZ_REGIONS } from "@/lib/regions";
import type { FormState } from "./auth";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(9).max(30),
  region: z.enum(UZ_REGIONS),
  city: z.string().trim().min(2).max(100),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(20).optional(),
  isDefault: z.boolean(),
});

export async function saveAddressAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" };
  const id = String(form.get("id") ?? "");
  const parsed = schema.safeParse({
    fullName: form.get("fullName"),
    phone: form.get("phone"),
    region: form.get("region"),
    city: form.get("city"),
    line1: form.get("line1"),
    line2: form.get("line2") || undefined,
    postalCode: form.get("postalCode") || undefined,
    isDefault: form.get("isDefault") === "on",
  });
  if (!parsed.success) {
    const values = Object.fromEntries(["fullName", "phone", "region", "city", "line1", "line2", "postalCode"].map((k) => [k, String(form.get(k) ?? "")]));
    return { fields: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), "required"])), values };
  }
  const data = { ...parsed.data, line2: parsed.data.line2 ?? null, postalCode: parsed.data.postalCode ?? null, country: "UZ" };
  const count = await db.address.count({ where: { userId: user.id } });
  if (data.isDefault || count === 0) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    data.isDefault = true;
  }
  if (id) {
    // Ownership enforced in the where clause.
    const res = await db.address.updateMany({ where: { id, userId: user.id }, data });
    if (res.count === 0) return { error: "auth" };
  } else {
    await db.address.create({ data: { ...data, userId: user.id } });
  }
  revalidatePath("/", "layout");
  return { success: "saved" };
}

export async function deleteAddressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function setDefaultAddressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const own = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!own) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/", "layout");
}
