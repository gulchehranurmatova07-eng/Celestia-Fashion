import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCustomer } from "@/lib/admin/queries";
import { dateOnly, dateTime, money } from "@/lib/admin/format";
import { ActionForm, FormStatus, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Empty, PageHeader, statusTone } from "@/components/admin/ui";
import { btnOutline, section, sectionHead, table, td, th } from "@/components/admin/styles";
import { setUserRoleAction } from "../actions";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, data] = await Promise.all([requireAdmin(), getCustomer(id)]);
  if (!data) notFound();
  const { user, orders, spent } = data;
  const isSelf = me.id === user.id;
  const target = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";

  return (
    <>
      <PageHeader
        title={user.name || user.email}
        eyebrow="Customer"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {user.role === "ADMIN" ? <Badge tone="dark">Admin</Badge> : <Badge>Customer</Badge>}
            <span>Joined {dateOnly(user.createdAt)}</span>
          </span>
        }
        actions={<Link href="/admin/customers" className="text-xs underline underline-offset-4">Back to customers</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={section} aria-labelledby="orders-h">
          <div className={sectionHead}>
            <h2 id="orders-h" className="eyebrow">Orders ({orders.length})</h2>
            <span className="text-xs text-ink-faint">Spent (excl. cancelled): {money(spent)}</span>
          </div>
          {orders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={table}>
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Date</th>
                    <th className={th}>Items</th>
                    <th className={th}>Total</th>
                    <th className={th}>Status</th>
                    <th className={th}>Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link></td>
                      <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(o.createdAt)}</td>
                      <td className={td}>{o._count.items}</td>
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
        <div className="space-y-6">
          <section className={section} aria-labelledby="contact-h">
            <div className={sectionHead}><h2 id="contact-h" className="eyebrow">Contact</h2></div>
            <dl className="space-y-2 p-4 text-sm">
              <div><dt className="text-xs text-ink-faint">Name</dt><dd>{user.name || "—"}</dd></div>
              <div><dt className="text-xs text-ink-faint">Email</dt><dd><a href={`mailto:${user.email}`} className="underline underline-offset-4">{user.email}</a></dd></div>
              <div><dt className="text-xs text-ink-faint">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
            </dl>
          </section>
          <section className={section} aria-labelledby="role-h">
            <div className={sectionHead}><h2 id="role-h" className="eyebrow">Role</h2></div>
            <div className="space-y-3 p-4 text-sm">
              {isSelf ? (
                <p className="text-ink-soft">This is your own account. You cannot remove your own administrator access.</p>
              ) : (
                <ActionForm action={setUserRoleAction} className="space-y-3">
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="role" value={target} />
                  <input type="hidden" name="confirm" value="yes" />
                  <p className="text-ink-soft">
                    {target === "ADMIN"
                      ? "Administrators can see all orders and customer data and change every setting."
                      : "This removes administrator access. The user is signed out everywhere."}
                  </p>
                  <SubmitButton
                    className={btnOutline}
                    confirm={target === "ADMIN" ? `Give ${user.email} full administrator access?` : `Remove administrator access from ${user.email}?`}
                  >
                    {target === "ADMIN" ? "Promote to admin" : "Demote to customer"}
                  </SubmitButton>
                  <FormStatus />
                </ActionForm>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
