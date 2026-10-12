"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionError, handle, idSchema, ok, refresh, str } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/customers";

export async function setUserRoleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id, role } = z
      .object({ id: idSchema, role: z.enum(["CUSTOMER", "ADMIN"]), confirm: z.literal("yes", "Confirmation required") })
      .parse({ id: str(fd, "id"), role: str(fd, "role"), confirm: str(fd, "confirm") });
    if (id === admin.id && role !== "ADMIN") throw new ActionError("You cannot remove your own administrator access.");
    const user = await db.user.findUnique({ where: { id }, select: { email: true, role: true } });
    if (!user) throw new ActionError("User not found.");
    if (user.role === role) return ok(`${user.email} is already ${role === "ADMIN" ? "an administrator" : "a customer"}.`);
    await db.$transaction([
      db.user.update({ where: { id }, data: { role } }),
      // Force a fresh sign-in so the new role takes effect everywhere immediately.
      db.session.deleteMany({ where: { userId: id } }),
    ]);
    refresh(P, `${P}/${id}`);
    return ok(role === "ADMIN" ? `${user.email} is now an administrator.` : `${user.email} is now a customer.`);
  });
}
