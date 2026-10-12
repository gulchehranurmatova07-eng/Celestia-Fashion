import Link from "next/link";
import { listOrders } from "@/lib/admin/queries";
import { PAYMENT_METHOD_LABEL, dateTime, money } from "@/lib/admin/format";
import { ORDER_STATUSES } from "@/lib/constants";
import { Badge, Empty, PageHeader, Pagination, statusTone } from "@/components/admin/ui";
import { btnDark, btnGhost, input, label, section, table, td, th } from "@/components/admin/styles";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const sp = await searchParams;
  const data = await listOrders(sp);
  const href = (page: number) => {
    const p = new URLSearchParams();
    if (data.q) p.set("q", data.q);
    if (data.status) p.set("status", data.status);
    p.set("page", String(page));
    return `/admin/orders?${p}`;
  };
  return (
    <>
      <PageHeader title="Orders" eyebrow="Sales" description={`${data.total} order${data.total === 1 ? "" : "s"}`} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label="Filter orders">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="oq" className={label}>Search number or email</label>
          <input id="oq" name="q" type="search" defaultValue={data.q} className={input} placeholder="CEL-… or name@example.com" />
        </div>
        <div>
          <label htmlFor="ostatus" className={label}>Status</label>
          <select id="ostatus" name="status" defaultValue={data.status} className={input}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" className={btnDark}>Apply</button>
        {data.q || data.status ? <Link href="/admin/orders" className={btnGhost}>Reset</Link> : null}
      </form>
      <section className={section}>
        {data.rows.length === 0 ? (
          <Empty>No orders found.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={`${table} min-w-[900px]`}>
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Date</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Items</th>
                  <th className={th}>Total</th>
                  <th className={th}>Status</th>
                  <th className={th}>Payment</th>
                  <th className={th}>Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((o) => (
                  <tr key={o.id}>
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link></td>
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(o.createdAt)}</td>
                    <td className={td}>
                      <div>{o.fullName}</div>
                      <div className="text-xs text-ink-faint">{o.email}</div>
                    </td>
                    <td className={td}>{o._count.items}</td>
                    <td className={`${td} whitespace-nowrap`}>{money(o.total)}</td>
                    <td className={td}><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                    <td className={td}><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                    <td className={`${td} text-ink-soft`}>{PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} pages={data.pages} makeHref={href} />
      </section>
    </>
  );
}
