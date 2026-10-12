import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { formatDate, formatPrice } from "@/lib/format";

type Row = { number: string; createdAt: Date; status: string; total: number; _count: { items: number } };

export async function OrdersTable({ orders, locale }: { orders: Row[]; locale: string }) {
  const t = await getTranslations("account");
  if (!orders.length) return <p className="border border-dashed border-line p-10 text-center text-sm text-ink-soft">{t("orders.empty")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-obsidian text-2xs uppercase tracking-wide2">
            <th scope="col" className="py-3 font-medium">{t("orders.number")}</th>
            <th scope="col" className="py-3 font-medium">{t("orders.date")}</th>
            <th scope="col" className="py-3 font-medium">{t("orders.status")}</th>
            <th scope="col" className="py-3 text-right font-medium">{t("orders.total")}</th>
            <th scope="col" className="sr-only py-3">{t("orders.view")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.number} className="border-b border-line">
              <td className="py-4 font-medium">{o.number}<span className="block text-xs font-normal text-ink-faint">{t("orders.items", { count: o._count.items })}</span></td>
              <td className="py-4 text-ink-soft">{formatDate(o.createdAt, locale)}</td>
              <td className="py-4">{t(`status.${o.status}`)}</td>
              <td className="py-4 text-right">{formatPrice(o.total, locale)}</td>
              <td className="py-4 text-right"><Link href={`/account/orders/${o.number}`} className="text-xs underline underline-offset-4">{t("orders.view")}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
