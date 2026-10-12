import Link from "next/link";
import { getDashboard, enName } from "@/lib/admin/queries";
import { dateTime, money } from "@/lib/admin/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Badge, Empty, PageHeader, statusTone } from "@/components/admin/ui";
import { section, sectionHead, table, td, th } from "@/components/admin/styles";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboard();
  const tiles = [
    { label: "Orders", value: d.ordersTotal.toLocaleString("en-US"), href: "/admin/orders" },
    { label: "Pending orders", value: d.ordersPending.toLocaleString("en-US"), href: "/admin/orders?status=PENDING" },
    { label: "Revenue (excl. cancelled)", value: money(d.revenue), href: "/admin/orders" },
    { label: "Active products", value: d.activeProducts.toLocaleString("en-US"), href: "/admin/products?status=ACTIVE" },
    { label: `Low-stock variants (≤ ${LOW_STOCK_THRESHOLD})`, value: d.lowStockCount.toLocaleString("en-US"), href: "#low-stock" },
    { label: "Newsletter subscribers", value: d.subscribers.toLocaleString("en-US"), href: "/admin/newsletter" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Overview" />

      {d.demoProducts > 0 ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-champagne-dark/40 bg-ivory px-4 py-3 text-sm">
          <p>
            <Badge tone="amber">Demo</Badge>{" "}
            <span className="ml-1">
              {d.demoProducts} demonstration product{d.demoProducts === 1 ? " is" : "s are"} flagged “Demo”. Replace them with
              your real stock before launch.
            </span>
          </p>
          <Link href="/admin/products?demo=1" className="text-xs underline underline-offset-4">
            Review demo products
          </Link>
        </div>
      ) : null}

      <ul className="mb-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <li key={t.label} className="bg-white">
            <Link href={t.href} className="block h-full px-4 py-5 hover:bg-ivory/60">
              <p className="text-2xs uppercase tracking-wide2 text-ink-faint">{t.label}</p>
              <p className="mt-2 font-serif text-2xl">{t.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={section} aria-labelledby="recent-orders">
          <div className={sectionHead}>
            <h2 id="recent-orders" className="eyebrow">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs underline underline-offset-4">All orders</Link>
          </div>
          {d.recentOrders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={table}>
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Date</th>
                    <th className={th}>Customer</th>
                    <th className={th}>Total</th>
                    <th className={th}>Status</th>
                    <th className={th}>Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(o.createdAt)}</td>
                      <td className={td}>
                        <div>{o.fullName}</div>
                        <div className="text-xs text-ink-faint">{o.email}</div>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{money(o.total)}</td>
                      <td className={td}><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                      <td className={td}><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="low-stock" className={section} aria-labelledby="low-stock-h">
          <div className={sectionHead}>
            <h2 id="low-stock-h" className="eyebrow">Low stock (≤ {LOW_STOCK_THRESHOLD})</h2>
            <span className="text-xs text-ink-faint">{d.lowStockCount} variants</span>
          </div>
          {d.lowStock.length === 0 ? (
            <Empty>All variants are well stocked.</Empty>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {d.lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/products/${v.product.id}`} className="block truncate hover:underline">
                      {enName(v.product.translations)}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {v.color.nameEn} · {v.size} · {v.sku} {v.product.isDemo ? <Badge tone="amber">Demo</Badge> : null}
                    </p>
                  </div>
                  <Badge tone={v.stock === 0 ? "red" : "amber"}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
