import Link from "next/link";
import { listCustomers } from "@/lib/admin/queries";
import { dateOnly, money } from "@/lib/admin/format";
import { Badge, Empty, PageHeader, Pagination } from "@/components/admin/ui";
import { btnDark, btnGhost, input, label, section, table, td, th } from "@/components/admin/styles";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; admins?: string; page?: string }> }) {
  const sp = await searchParams;
  const data = await listCustomers(sp);
  const href = (page: number) => {
    const p = new URLSearchParams();
    if (data.q) p.set("q", data.q);
    if (sp.admins === "1") p.set("admins", "1");
    p.set("page", String(page));
    return `/admin/customers?${p}`;
  };
  return (
    <>
      <PageHeader title="Customers" eyebrow="People" description={`${data.total} account${data.total === 1 ? "" : "s"}`} />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label="Filter customers">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="cq" className={label}>Search name, email or phone</label>
          <input id="cq" name="q" type="search" defaultValue={data.q} className={input} />
        </div>
        <div className="flex h-10 items-center gap-2">
          <input id="cadm" name="admins" type="checkbox" value="1" defaultChecked={sp.admins === "1"} className="h-4 w-4 accent-obsidian" />
          <label htmlFor="cadm" className="text-sm">Include administrators</label>
        </div>
        <button type="submit" className={btnDark}>Apply</button>
        {data.q || sp.admins ? <Link href="/admin/customers" className={btnGhost}>Reset</Link> : null}
      </form>
      <section className={section}>
        {data.rows.length === 0 ? (
          <Empty>No customers yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={table}>
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Joined</th>
                  <th className={th}>Orders</th>
                  <th className={th}>Total spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((u) => (
                  <tr key={u.id}>
                    <td className={td}>
                      <Link href={`/admin/customers/${u.id}`} className="font-medium hover:underline">{u.name || "—"}</Link>{" "}
                      {u.role === "ADMIN" ? <Badge tone="dark">Admin</Badge> : null}
                    </td>
                    <td className={td}>{u.email}</td>
                    <td className={`${td} text-ink-soft`}>{u.phone ?? "—"}</td>
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateOnly(u.createdAt)}</td>
                    <td className={td}>{u._count.orders}</td>
                    <td className={`${td} whitespace-nowrap`}>{money(u.spent)}</td>
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
