import { getTranslations, setRequestLocale } from "next-intl/server";
import { parseFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { CatalogView } from "@/components/catalog/CatalogView";
import { SearchIcon } from "@/components/ui/Icons";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return pageMetadata({ title: q ? t("searchResultsFor", { q: String(q) }) : t("search.title"), path: "/search", locale, noindex: true });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const t = await getTranslations("catalog");

  const form = (
    <div className="pb-10 pt-10">
      <h1 className="heading-display mb-6 text-5xl md:text-7xl">
        {filters.q ? t("searchResultsFor", { q: filters.q }) : t("search.title")}
      </h1>
      <form role="search" action="" method="get" className="flex max-w-2xl items-center gap-3 border-b border-obsidian">
        <SearchIcon />
        <label htmlFor="search-q" className="sr-only">{t("search.title")}</label>
        <input id="search-q" name="q" type="search" defaultValue={filters.q} placeholder={t("search.placeholder")} className="h-14 flex-1 bg-transparent text-lg outline-none" />
        <button type="submit" className="text-2xs font-medium uppercase tracking-wide2">{t("search.submit")}</button>
      </form>
      {!filters.q && <p className="mt-4 text-sm text-ink-soft">{t("search.prompt")}</p>}
    </div>
  );

  return <CatalogView basePath="/search" params={sp} filters={filters} locale={locale} intro={form} />;
}
