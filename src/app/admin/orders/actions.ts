"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { ActionError, bool, handle, idSchema, ok, refresh, str } from "@/lib/admin/action";
import { orderStatusEmail } from "@/lib/admin/order-emails";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/orders";

export async function updateOrderStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const { id, status } = z.object({ id: idSchema, status: z.enum(ORDER_STATUSES) }).parse({ id: str(fd, "id"), status: str(fd, "status") });
    const notify = bool(fd, "notify");

    const order = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new ActionError("Order not found.");
      if (current.status === status) throw new ActionError(`The order is already ${status}.`);
      if (current.status === "CANCELLED") {
        throw new ActionError("Cancelled orders cannot be reopened (stock has already been returned). Create a new order instead.");
      }
      if (status === "CANCELLED") {
        // Return stock and reverse the sales counter for every line.
        for (const item of current.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          }
          if (item.productId) {
            const p = await tx.product.findUnique({ where: { id: item.productId }, select: { salesCount: true } });
            if (p) {
              await tx.product.update({
                where: { id: item.productId },
                data: { salesCount: Math.max(0, p.salesCount - item.quantity) },
              });
            }
          }
        }
      }
      // Conditional update guards against a concurrent status change.
      const res = await tx.order.updateMany({ where: { id, status: current.status }, data: { status } });
      if (res.count !== 1) throw new ActionError("The order was changed by someone else. Reload and try again.");
      return current;
    });

    let emailNote = "";
    if (notify) {
      const { subject, body } = orderStatusEmail(order.locale, order.number, order.fullName, status);
      const sent = await sendEmail(order.email, subject, body);
      emailNote = sent.delivered ? " Customer emailed." : " Email stored in the outbox (not delivered — SMTP not configured or failed).";
    }
    refresh(P, `${P}/${id}`, "/admin", "/admin/outbox");
    return ok(`Status changed to ${status}.${status === "CANCELLED" ? " Stock restored." : ""}${emailNote}`);
  });
}

export async function updatePaymentStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const { id, paymentStatus } = z
      .object({ id: idSchema, paymentStatus: z.enum(PAYMENT_STATUSES) })
      .parse({ id: str(fd, "id"), paymentStatus: str(fd, "paymentStatus") });
    await db.order.update({ where: { id }, data: { paymentStatus } });
    refresh(P, `${P}/${id}`, "/admin");
    return ok(`Payment status set to ${paymentStatus}.`);
  });
}
