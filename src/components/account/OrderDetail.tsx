import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { formatDate, formatPrice } from "@/lib/format";

type Order = {
  number: string; createdAt: Date; status: string; paymentStatus: string; paymentMethod: string; deliveryMethod: string;
  fullName: string; phone: string; email: string; region: string; city: string; line1: string; line2: string | null; postalCode: string | null;
  subtotal: number; discount: number; discountCode: string | null; shipping: number; total: number;
  items: { id: string; name: string; colorName: string; size: string; image: string | null; unitPrice: number; quantity: number }[];
};

export async function OrderDetail({ order, locale }: { order: Order; locale: string }) {
  const t = await getTranslations("account");
  const tc = await getTranslations("checkout");
  const tcart = await getTranslations("cart");
  const tp = await getTranslations("common.product");
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex gap-4 py-5">
              <div className="relative aspect-product w-20 shrink-0 bg-[#141414]">
                {i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-serif text-lg leading-tight">{i.name}</p>
                <p className="mt-1 text-xs text-ink-soft">{i.colorName} · {i.size === "OS" ? tp("oneSize") : i.size} · × {i.quantity}</p>
              </div>
              <p className="text-sm">{formatPrice(i.unitPrice * i.quantity, locale)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="eyebrow mb-3">{t("orders.address")}</h3>
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              {order.fullName}<br />{order.line1}{order.line2 ? `, ${order.line2}` : ""}<br />
              {order.city}, {tc(`regions.${order.region}`)}{order.postalCode ? `, ${order.postalCode}` : ""}<br />{order.phone}<br />{order.email}
            </address>
          </div>
          <div className="space-y-4 text-sm">
            <div><h3 className="eyebrow mb-1.5">{t("orders.delivery")}</h3><p className="text-ink-soft">{tc(`methods.${order.deliveryMethod}`)}</p></div>
            <div><h3 className="eyebrow mb-1.5">{t("orders.payment")}</h3><p className="text-ink-soft">{tc(`payments.${order.paymentMethod}`)} — {t(`status.${order.paymentStatus}`)}</p></div>
          </div>
        </div>
      </div>
      <aside className="h-fit bg-ivory p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt>{t("orders.status")}</dt><dd className="font-medium">{t(`status.${order.status}`)}</dd></div>
          <div className="flex justify-between"><dt>{t("orders.date")}</dt><dd>{formatDate(order.createdAt, locale)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3"><dt>{tcart("subtotal")}</dt><dd>{formatPrice(order.subtotal, locale)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-[#8E1B22]"><dt>{tcart("discount")} ({order.discountCode})</dt><dd>−{formatPrice(order.discount, locale)}</dd></div>}
          <div className="flex justify-between"><dt>{tcart("shipping")}</dt><dd>{order.shipping === 0 ? tcart("free") : formatPrice(order.shipping, locale)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>{tcart("grandTotal")}</dt><dd>{formatPrice(order.total, locale)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
