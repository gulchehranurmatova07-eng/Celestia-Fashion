import Link from "next/link";
import { listDiscounts } from "@/lib/admin/queries";
import { dateOnly, money } from "@/lib/admin/format";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { Badge, Banner, Empty, PageHeader } from "@/components/admin/ui";
import { btnGhost, section, sectionHead, table, td, th } from "@/components/admin/styles";
import { deleteDiscountAction, toggleDiscountAction } from "./actions";

export const metadata = { title: "Discounts" };

function state(d: { active: boolean; startsAt: Date | null; endsAt: Date | null; maxUses: number | null; usedCount: number }) {
  const now = new Date();
  if (!d.active) return { label: "Inactive", tone: "neutral" as const };
  if (d.endsAt && d.endsAt < now) return { label: "Expired", tone: "red" as const };
  if (d.startsAt && d.startsAt > now) return { label: "Scheduled", tone: "amber" as const };
  if (d.maxUses != null && d.usedCount >= d.maxUses) return { label: "Used up", tone: "red" as const };
  return { label: "Live", tone: "green" as const };
}

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<{ created?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const rows = await listDiscounts();
  return (
    <>
      <PageHeader title="Discount codes" eyebrow="Sales" />
      {sp.created ? <Banner>Discount code created.</Banner> : null}
      {sp.deleted ? <Banner>Discount code deleted.</Banner> : null}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className={section}>
          {rows.length === 0 ? (
            <Empty>No discount codes yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={`${table} min-w-[760px]`}>
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Code</th>
                    <th className={th}>Discount</th>
                    <th className={th}>Min. subtotal</th>
                    <th className={th}>Used</th>
                    <th className={th}>Window</th>
                    <th className={th}>Status</th>
                    <th className={th}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((d) => {
                    const s = state(d);
                    return (
                      <tr key={d.id}>
                        <td className={td}><Link href={`/admin/discounts/${d.id}`} className="font-mono font-medium hover:underline">{d.code}</Link></td>
                        <td className={td}>{d.type === "PERCENT" ? `${d.value}%` : money(d.value)}</td>
                        <td className={`${td} whitespace-nowrap`}>{d.minSubtotal ? money(d.minSubtotal) : "—"}</td>
                        <td className={td}>{d.usedCount}{d.maxUses != null ? ` / ${d.maxUses}` : ""}</td>
                        <td className={`${td} whitespace-nowrap text-xs text-ink-soft`}>
                          {d.startsAt ? dateOnly(d.startsAt) : "Any time"} – {d.endsAt ? dateOnly(d.endsAt) : "no end"}
                        </td>
                        <td className={td}><Badge tone={s.tone}>{s.label}</Badge></td>
                        <td className={td}>
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/discounts/${d.id}`} className={btnGhost} aria-label={`Edit ${d.code}`}>Edit</Link>
                            <ActionForm action={toggleDiscountAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <input type="hidden" name="active" value={d.active ? "0" : "1"} />
                              <SubmitButton className={btnGhost} aria-label={`${d.active ? "Deactivate" : "Activate"} ${d.code}`}>
                                {d.active ? "Deactivate" : "Activate"}
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm action={deleteDiscountAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <SubmitButton className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`} confirm={`Delete code ${d.code}?`} aria-label={`Delete ${d.code}`}>
                                Delete
                              </SubmitButton>
                            </ActionForm>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className={`${section} self-start`} aria-labelledby="new-code-h">
          <div className={sectionHead}><h2 id="new-code-h" className="eyebrow">New code</h2></div>
          <DiscountForm />
        </section>
      </div>
    </>
  );
}
