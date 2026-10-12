import Link from "next/link";
import { listSubscribers } from "@/lib/admin/queries";
import { dateTime } from "@/lib/admin/format";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Empty, PageHeader, Pagination, statusTone } from "@/components/admin/ui";
import { btnDark, btnGhost, btnOutline, input, label, section, table, td, th } from "@/components/admin/styles";
import { deleteSubscriberAction, setSubscriberStatusAction } from "./actions";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const data = await listSubscribers(sp);
  const href = (page: number) => {
    const p = new URLSearchParams();
    if (data.status) p.set("status", data.status);
    if (data.q) p.set("q", data.q);
    p.set("page", String(page));
    return `/admin/newsletter?${p}`;
  };
  const exportHref = `/admin/newsletter/export${data.status ? `?status=${data.status}` : ""}`;
  return (
    <>
      <PageHeader
        title="Newsletter"
        eyebrow="Marketing"
        description={`${data.total} subscriber record${data.total === 1 ? "" : "s"} match the filter.`}
        actions={
          <a href={exportHref} className={btnOutline} download>
            Export CSV{data.status ? ` (${data.status.toLowerCase()})` : ""}
          </a>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label="Filter subscribers">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="nq" className={label}>Search email</label>
          <input id="nq" name="q" type="search" defaultValue={data.q} className={input} />
        </div>
        <div>
          <label htmlFor="nstatus" className={label}>Status</label>
          <select id="nstatus" name="status" defaultValue={data.status} className={input}>
            <option value="">All</option>
            <option value="SUBSCRIBED">SUBSCRIBED</option>
            <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
          </select>
        </div>
        <button type="submit" className={btnDark}>Apply</button>
        {data.q || data.status ? <Link href="/admin/newsletter" className={btnGhost}>Reset</Link> : null}
      </form>
      <section className={section}>
        {data.rows.length === 0 ? (
          <Empty>No subscribers found.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={table}>
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Locale</th>
                  <th className={th}>Consent</th>
                  <th className={th}>Status</th>
                  <th className={th}>Source</th>
                  <th className={th}>Date</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((s) => (
                  <tr key={s.id}>
                    <td className={td}>{s.email}</td>
                    <td className={td}>{s.locale.toUpperCase()}</td>
                    <td className={td}>{s.consent ? "Yes" : "No"}</td>
                    <td className={td}><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                    <td className={`${td} text-ink-soft`}>{s.source}</td>
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(s.createdAt)}</td>
                    <td className={td}>
                      <div className="flex justify-end gap-2">
                        <ActionForm action={setSubscriberStatusAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="status" value={s.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED"} />
                          <SubmitButton
                            className={btnGhost}
                            aria-label={`${s.status === "SUBSCRIBED" ? "Unsubscribe" : "Resubscribe"} ${s.email}`}
                            confirm={s.status === "SUBSCRIBED" ? undefined : `Resubscribe ${s.email}? Only do this if they asked to be resubscribed.`}
                          >
                            {s.status === "SUBSCRIBED" ? "Unsubscribe" : "Resubscribe"}
                          </SubmitButton>
                        </ActionForm>
                        <ActionForm action={deleteSubscriberAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <SubmitButton className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`} confirm={`Delete ${s.email} permanently?`} aria-label={`Delete ${s.email}`}>
                            Delete
                          </SubmitButton>
                        </ActionForm>
                      </div>
                    </td>
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
