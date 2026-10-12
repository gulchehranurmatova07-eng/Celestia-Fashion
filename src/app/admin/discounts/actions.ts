"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionError, bool, handle, idSchema, ok, refresh, str } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/discounts";

const dateStr = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")]);
const optInt = (min: number) => z.union([z.literal(""), z.coerce.number().int("Must be a whole number").min(min).max(2_000_000_000)]);

const schema = z
  .object({
    id: z.string().trim().max(64).optional(),
    code: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(32)
      .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, - or _"),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").max(2_000_000_000),
    minSubtotal: z.coerce.number().int().min(0).max(2_000_000_000),
    maxUses: optInt(1),
    startsAt: dateStr,
    endsAt: dateStr,
    active: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && d.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent must be between 1 and 100" });
    if (d.startsAt && d.endsAt && d.endsAt < d.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date is before the start date" });
  });

// Dates are entered in store time (Asia/Tashkent, UTC+5).
const startOf = (d: string) => (d ? new Date(`${d}T00:00:00+05:00`) : null);
const endOf = (d: string) => (d ? new Date(`${d}T23:59:59.999+05:00`) : null);

export async function saveDiscountAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const d = schema.parse({
      id: str(fd, "id") || undefined,
      code: str(fd, "code").toUpperCase().replace(/\s+/g, ""),
      type: str(fd, "type"),
      value: str(fd, "value"),
      minSubtotal: str(fd, "minSubtotal") || "0",
      maxUses: str(fd, "maxUses"),
      startsAt: str(fd, "startsAt"),
      endsAt: str(fd, "endsAt"),
      active: bool(fd, "active"),
    });
    const owner = await db.discountCode.findUnique({ where: { code: d.code }, select: { id: true } });
    if (owner && owner.id !== d.id) throw new ActionError("This code already exists.", { code: "Already in use" });
    const data = {
      code: d.code,
      type: d.type,
      value: d.value,
      minSubtotal: d.minSubtotal,
      maxUses: d.maxUses === "" ? null : d.maxUses,
      startsAt: startOf(d.startsAt),
      endsAt: endOf(d.endsAt),
      active: d.active,
    };
    if (d.id) await db.discountCode.update({ where: { id: d.id }, data });
    else await db.discountCode.create({ data });
    refresh(P, ...(d.id ? [`${P}/${d.id}`] : []));
    return ok(d.id ? "Discount code saved." : `Discount code ${d.code} created.`);
  });
}

export async function toggleDiscountAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const active = bool(fd, "active");
    const row = await db.discountCode.update({ where: { id }, data: { active } });
    refresh(P, `${P}/${id}`);
    return ok(`${row.code} ${active ? "activated" : "deactivated"}.`);
  });
}

export async function deleteDiscountAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let go = false;
  const result = await handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const row = await db.discountCode.delete({ where: { id } });
    refresh(P);
    go = str(fd, "redirect") === "1";
    return ok(`${row.code} deleted. Past orders keep the code on record.`);
  });
  if (go) redirect(`${P}?deleted=1`);
  return result;
}
