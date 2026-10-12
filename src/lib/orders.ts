import "server-only";
import { randomInt } from "crypto";
import { db } from "./db";
import { randomToken } from "./auth";
import { colorName, pickTranslation } from "./catalog";
import { evaluateDiscount, shippingCost, type DeliveryMethod } from "./pricing";
import { formatPrice } from "./format";
import { sendEmail, siteUrl } from "./email";
import type { PaymentProvider } from "./payments";

export type OrderInput = {
  userId: string | null;
  locale: string;
  email: string;
  phone: string;
  fullName: string;
  country: string;
  region: string;
  city: string;
  line1: string;
  line2?: string;
  postalCode?: string;
  notes?: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentProvider;
  discountCode?: string;
  lines: { variantId: string; quantity: number }[];
};

export type StockIssue = { variantId: string; available: number };

export class StockError extends Error {
  constructor(public issues: StockIssue[]) {
    super("stock");
  }
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CE${ymd}-${randomInt(1000, 9999)}`;
}

/**
 * Places an order with server-side pricing, stock reservation and discount validation.
 * Prices from the client are never trusted.
 */
export async function placeOrder(input: OrderInput, settings: Parameters<typeof shippingCost>[2]) {
  // Merge duplicate lines.
  const qty = new Map<string, number>();
  for (const l of input.lines) qty.set(l.variantId, (qty.get(l.variantId) ?? 0) + l.quantity);

  const variants = await db.productVariant.findMany({
    where: { id: { in: [...qty.keys()] } },
    include: {
      color: true,
      product: { include: { translations: true, images: { orderBy: { sortOrder: "asc" }, select: { url: true, colorId: true } } } },
    },
  });

  const issues: StockIssue[] = [];
  for (const [id, q] of qty) {
    const v = variants.find((x) => x.id === id);
    if (!v || v.product.status !== "ACTIVE") issues.push({ variantId: id, available: 0 });
    else if (v.stock < q) issues.push({ variantId: id, available: v.stock });
  }
  if (issues.length) throw new StockError(issues);

  const subtotal = variants.reduce((s, v) => s + v.product.price * (qty.get(v.id) ?? 0), 0);
  let discount = 0;
  let discountCode: string | null = null;
  if (input.discountCode) {
    const d = await evaluateDiscount(input.discountCode, subtotal);
    if (!d.ok) throw new Error("discount");
    discount = d.amount;
    discountCode = d.code;
  }
  const shipping = shippingCost(input.deliveryMethod, subtotal - discount, settings);
  const total = subtotal - discount + shipping;

  const order = await db.$transaction(async (tx) => {
    for (const v of variants) {
      const q = qty.get(v.id)!;
      // Conditional decrement guards against concurrent purchases of the last items.
      const res = await tx.productVariant.updateMany({ where: { id: v.id, stock: { gte: q } }, data: { stock: { decrement: q } } });
      if (res.count === 0) {
        const fresh = await tx.productVariant.findUnique({ where: { id: v.id }, select: { stock: true } });
        throw new StockError([{ variantId: v.id, available: fresh?.stock ?? 0 }]);
      }
      await tx.product.update({ where: { id: v.productId }, data: { salesCount: { increment: q } } });
    }
    if (discountCode) {
      const code = await tx.discountCode.findUniqueOrThrow({ where: { code: discountCode } });
      if (code.maxUses != null && code.usedCount >= code.maxUses) throw new Error("discount");
      await tx.discountCode.update({ where: { code: discountCode }, data: { usedCount: { increment: 1 } } });
    }

    let number = orderNumber();
    while (await tx.order.findUnique({ where: { number }, select: { id: true } })) number = orderNumber();

    return tx.order.create({
      data: {
        number,
        accessToken: randomToken(24),
        userId: input.userId,
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        country: input.country,
        region: input.region,
        city: input.city,
        line1: input.line1,
        line2: input.line2 || null,
        postalCode: input.postalCode || null,
        notes: input.notes || null,
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        locale: input.locale,
        subtotal,
        discount,
        shipping,
        total,
        discountCode,
        items: {
          create: variants.map((v) => {
            const image = v.product.images.find((i) => i.colorId === v.colorId) ?? v.product.images[0];
            return {
              productId: v.productId,
              variantId: v.id,
              name: pickTranslation(v.product.translations, input.locale)?.name ?? v.product.slug,
              colorName: colorName(v.color, input.locale),
              size: v.size,
              sku: v.sku,
              image: image?.url ?? null,
              unitPrice: v.product.price,
              quantity: qty.get(v.id)!,
            };
          }),
        },
        payments: { create: { provider: input.paymentMethod, status: "PENDING", amount: total } },
      },
      include: { items: true },
    });
  });

  const lines = order.items.map((i) => `• ${i.name} — ${i.colorName}, ${i.size} × ${i.quantity}: ${formatPrice(i.unitPrice * i.quantity, order.locale)}`);
  await sendEmail(
    order.email,
    `CELESTIA — order ${order.number}`,
    [
      `Thank you, ${order.fullName}.`,
      `We have received your order ${order.number}.`,
      "",
      ...lines,
      "",
      `Subtotal: ${formatPrice(order.subtotal, order.locale)}`,
      order.discount ? `Discount (${order.discountCode}): −${formatPrice(order.discount, order.locale)}` : "",
      `Delivery: ${formatPrice(order.shipping, order.locale)}`,
      `Total: ${formatPrice(order.total, order.locale)}`,
      "",
      `View your order: ${siteUrl(`/${order.locale === "en" ? "" : order.locale + "/"}order/${order.number}?token=${order.accessToken}`)}`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  );

  return order;
}
