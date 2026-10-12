import { listOutbox } from "@/lib/admin/queries";
import { dateTime } from "@/lib/admin/format";
import { Badge, Banner, Empty, PageHeader, Pagination } from "@/components/admin/ui";
import { section } from "@/components/admin/styles";

export const metadata = { title: "Outbox" };

export default async function OutboxPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const data = await listOutbox(sp);
  return (
    <>
      <PageHeader
        title="Email outbox"
        eyebrow="System"
        description={`${data.total} message${data.total === 1 ? "" : "s"} · ${data.undelivered} not delivered`}
      />
      {data.smtpConfigured ? (
        <Banner tone="info">SMTP is configured. Every email is logged here; failed deliveries show their error.</Banner>
      ) : (
        <Banner tone="info">
          <strong>SMTP is not configured</strong> (SMTP_HOST is empty). Emails such as order confirmations and status updates are
          stored here and printed to the server log — they are <strong>not delivered</strong> to customers. Set SMTP_HOST, SMTP_PORT,
          SMTP_USER, SMTP_PASSWORD and EMAIL_FROM to send real email.
        </Banner>
      )}
      <section className={section}>
        {data.rows.length === 0 ? (
          <Empty>No emails yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {data.rows.map((m) => (
              <li key={m.id}>
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-ivory/50">
                    <span className="w-40 shrink-0 text-xs text-ink-faint">{dateTime(m.createdAt)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{m.subject}</span>
                      <span className="block truncate text-xs text-ink-soft">to {m.to}</span>
                    </span>
                    <Badge tone={m.delivered ? "green" : m.error ? "red" : "amber"}>{m.delivered ? "Delivered" : m.error ? "Failed" : "Not sent"}</Badge>
                  </summary>
                  <div className="border-t border-line bg-[#FBFAF7] px-4 py-3">
                    {m.error ? <p className="mb-2 text-xs text-[#9B1C1C]">Error: {m.error}</p> : null}
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-ink-soft">{m.body}</pre>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={data.page} pages={data.pages} makeHref={(p) => `/admin/outbox?page=${p}`} />
      </section>
    </>
  );
}
