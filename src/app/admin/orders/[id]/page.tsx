import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin/queries";
import { PAYMENT_METHOD_LABEL, dateTime, money } from "@/lib/admin/format";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { ActionForm, FormStatus, SubmitButton } from "@/components/admin/ActionForm";
import { Checkbox, SelectField } from "@/components/admin/fields";
import { Badge, PageHeader, Thumb, statusTone } from "@/components/admin/ui";
import { btnDark, section, sectionHead, table, td, th } from "@/components/admin/styles";
import { updateOrderStatusAction, updatePaymentStatusAction } from "../actions";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const cancelled = order.status === "CANCELLED";

  return (
    <>
      <PageHeader
        title={`Order ${order.number}`}
        eyebrow="Sales"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {dateTime(order.createdAt)}
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
            <span className="text-xs text-ink-faint">Locale: {order.locale.toUpperCase()}</span>
          </span>
        }
        actions={<Link href="/admin/orders" className="text-xs underline underline-offset-4">Back to orders</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className={section} aria-labelledby="items-h">
            <div className={sectionHead}><h2 id="items-h" className="eyebrow">Items</h2></div>
            <div className="overflow-x-auto">
              <table className={table}>
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}><span className="sr-only">Image</span></th>
                    <th className={th}>Product</th>
                    <th className={th}>SKU</th>
                    <th className={th}>Unit</th>
                    <th className={th}>Qty</th>
                    <th className={th}>Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className={`${td} w-14`}><Thumb src={i.image} /></td>
                      <td className={td}>
                        {i.product ? (
                          <Link href={`/admin/products/${i.product.id}`} className="font-medium hover:underline">{i.name}</Link>
                        ) : (
                          <span className="font-medium">{i.name}</span>
                        )}
                        <div className="text-xs text-ink-faint">
                          {i.colorName} · {i.size}
                          {!i.product ? " · product deleted" : ""}
                        </div>
                      </td>
                      <td className={`${td} font-mono text-xs`}>{i.sku}</td>
                      <td className={`${td} whitespace-nowrap`}>{money(i.unitPrice)}</td>
                      <td className={td}>{i.quantity}</td>
                      <td className={`${td} whitespace-nowrap`}>{money(i.unitPrice * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-sm space-y-1.5 border-t border-line px-4 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
                <dd>{order.discount ? `− ${money(order.discount)}` : money(0)}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{money(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-medium"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </section>

          <section className={section} aria-labelledby="cust-h">
            <div className={sectionHead}><h2 id="cust-h" className="eyebrow">Customer & delivery</h2></div>
            <div className="grid gap-6 p-4 text-sm md:grid-cols-2">
              <div>
                <p className="eyebrow mb-2 text-ink-faint">Contact</p>
                <p>{order.fullName}</p>
                <p><a href={`mailto:${order.email}`} className="underline underline-offset-4">{order.email}</a></p>
                <p>{order.phone}</p>
                {order.user ? (
                  <p className="mt-2 text-xs"><Link href={`/admin/customers/${order.user.id}`} className="underline underline-offset-4">Customer account</Link></p>
                ) : (
                  <p className="mt-2 text-xs text-ink-faint">Guest checkout</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-2 text-ink-faint">Shipping address</p>
                <address className="not-italic">
                  {order.line1}
                  {order.line2 ? <><br />{order.line2}</> : null}
                  <br />
                  {order.city}, {order.region}
                  {order.postalCode ? ` ${order.postalCode}` : ""}
                  <br />
                  {order.country}
                </address>
                <p className="mt-2 text-xs text-ink-soft">Delivery: {order.deliveryMethod}</p>
              </div>
              <div>
                <p className="eyebrow mb-2 text-ink-faint">Payment</p>
                <p>{PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
                {order.payments.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                    {order.payments.map((p) => (
                      <li key={p.id}>
                        {p.provider} · {p.status} · {money(p.amount)} · {dateTime(p.createdAt)}
                        {p.externalId ? ` · ${p.externalId}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div>
                <p className="eyebrow mb-2 text-ink-faint">Notes</p>
                <p className="whitespace-pre-wrap text-ink-soft">{order.notes || "—"}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className={section} aria-labelledby="status-h">
            <div className={sectionHead}><h2 id="status-h" className="eyebrow">Order status</h2></div>
            {cancelled ? (
              <p className="p-4 text-sm text-ink-soft">
                This order is cancelled. Stock was returned to inventory; cancelled orders cannot be reopened.
              </p>
            ) : (
              <ActionForm
                action={updateOrderStatusAction}
                className="space-y-4 p-4"
                confirm="Change the order status? Cancelling returns stock and cannot be undone."
              >
                <input type="hidden" name="id" value={order.id} />
                <SelectField
                  label="New status"
                  name="status"
                  defaultValue={order.status}
                  options={ORDER_STATUSES.map((s) => ({ value: s, label: s === order.status ? `${s} (current)` : s }))}
                  hint="Cancelling returns all items to stock and cannot be undone."
                />
                <Checkbox label="Email the customer about this change" name="notify" defaultChecked />
                <div className="flex flex-wrap items-center gap-3">
                  <SubmitButton className={btnDark} pendingText="Updating…">Update status</SubmitButton>
                  <FormStatus />
                </div>
              </ActionForm>
            )}
          </section>
          <section className={section} aria-labelledby="pay-h">
            <div className={sectionHead}><h2 id="pay-h" className="eyebrow">Payment status</h2></div>
            <ActionForm action={updatePaymentStatusAction} className="space-y-4 p-4">
              <input type="hidden" name="id" value={order.id} />
              <SelectField
                label="Payment status"
                name="paymentStatus"
                defaultValue={order.paymentStatus}
                options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))}
              />
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton className={btnDark} pendingText="Saving…">Save payment status</SubmitButton>
                <FormStatus />
              </div>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  );
}
