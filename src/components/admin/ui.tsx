import Link from "next/link";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-1 text-ink-faint">{eyebrow}</p> : null}
        <h1 className="font-serif text-3xl font-light">{title}</h1>
        {description ? <div className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const TONES = {
  neutral: "border-line text-ink-soft",
  dark: "border-obsidian bg-obsidian text-ivory",
  green: "border-[#1F5132]/40 text-[#1F5132]",
  red: "border-[#9B1C1C]/40 text-[#9B1C1C]",
  amber: "border-champagne-dark/50 bg-ivory text-champagne-dark",
} as const;

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide2 ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof TONES {
  switch (status) {
    case "ACTIVE":
    case "DELIVERED":
    case "PAID":
    case "SUBSCRIBED":
      return "green";
    case "CANCELLED":
    case "ARCHIVED":
    case "REFUNDED":
    case "UNSUBSCRIBED":
      return "red";
    case "PENDING":
    case "DRAFT":
    case "UNPAID":
      return "amber";
    default:
      return "neutral";
  }
}

export function Banner({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "error" | "info" }) {
  const cls =
    tone === "ok"
      ? "border-[#1F5132]/40 text-[#1F5132]"
      : tone === "error"
        ? "border-[#9B1C1C]/40 text-[#9B1C1C]"
        : "border-line bg-ivory text-ink-soft";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-4 border bg-white px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-ink-faint">{children}</p>;
}

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-4 py-3 text-xs">
      {page > 1 ? <Link href={makeHref(page - 1)} className="underline underline-offset-4">Previous</Link> : <span />}
      <span className="text-ink-faint">
        Page {page} of {pages}
      </span>
      {page < pages ? <Link href={makeHref(page + 1)} className="underline underline-offset-4">Next</Link> : <span />}
    </nav>
  );
}

export function Thumb({ src, alt = "" }: { src?: string | null; alt?: string }) {
  return (
    <div className="h-14 w-11 shrink-0 overflow-hidden border border-line bg-ivory">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : null}
    </div>
  );
}
