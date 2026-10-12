"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, idSchema, ok, refresh, str } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/newsletter";

export async function setSubscriberStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const { id, status } = z
      .object({ id: idSchema, status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]) })
      .parse({ id: str(fd, "id"), status: str(fd, "status") });
    const row = await db.newsletterSubscriber.update({ where: { id }, data: { status } });
    refresh(P, "/admin");
    return ok(`${row.email} ${status === "UNSUBSCRIBED" ? "unsubscribed" : "resubscribed"}.`);
  });
}

export async function deleteSubscriberAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const row = await db.newsletterSubscriber.delete({ where: { id } });
    refresh(P, "/admin");
    return ok(`${row.email} deleted.`);
  });
}
