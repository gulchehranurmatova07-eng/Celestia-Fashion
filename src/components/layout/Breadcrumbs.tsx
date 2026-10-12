import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo";

export async function Breadcrumbs({ items, locale }: { items: { label: string; href?: string }[]; locale: string }) {
  const t = await getTranslations("common");
  const all = [{ label: t("nav.home"), href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: localizedUrl(it.href, locale) } : {}),
    })),
  };
  return (
    <nav aria-label={t("breadcrumbs.label")} className="py-5">
      <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {all.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {it.href && i < all.length - 1 ? (
              <Link href={it.href} className="hover:text-ink">{it.label}</Link>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-ink-soft">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
