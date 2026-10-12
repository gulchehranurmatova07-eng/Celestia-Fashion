import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { queryCatalog, getCategoryTree, type CatalogFilters as Filters } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CloseIcon } from "@/components/ui/Icons";
import { CatalogFilters } from "./CatalogFilters";
import { SortSelect } from "./SortSelect";

type Params = Record<string, string | string[] | undefined>;

/** Shared catalogue layout used by /catalog, /search and /collections/[slug]. */
export async function CatalogView({
  basePath,
  params,
  filters,
  locale,
  hide,
  intro,
}: {
  basePath: string;
  params: Params;
  filters: Filters;
  locale: string;
  hide?: ("gender" | "category")[];
  intro?: React.ReactNode;
}) {
  const t = await getTranslations("catalog");
  const tc = await getTranslations("common");
  const [result, tree] = await Promise.all([queryCatalog(filters, locale), getCategoryTree(locale)]);

  // Flat query object of the URL (single values) passed to client controls.
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val && k !== "page") query[k] = val;
  }

  const catName = new Map<string, string>();
  tree.forEach((c) => {
    catName.set(c.slug, c.name);
    c.children.forEach((ch) => catName.set(ch.slug, ch.name));
  });
  const colorName = new Map(result.facets.colors.map((c) => [c.slug, c.name]));
  const brandName = new Map(result.facets.brands.map((b) => [b.slug, b.name]));

  const href = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const without = (key: string, value: string) => {
    const rest = (query[key] ?? "").split(",").filter((v) => v && v !== value);
    return href({ [key]: rest.length ? rest.join(",") : null });
  };

  const chips: { label: string; href: string }[] = [];
  if (filters.gender && !hide?.includes("gender")) chips.push({ label: t(`gender.${filters.gender}`), href: href({ gender: null }) });
  if (filters.category && !hide?.includes("category")) chips.push({ label: catName.get(filters.category) ?? filters.category, href: href({ category: null }) });
  filters.sizes.forEach((s) => chips.push({ label: `${t("groups.size")}: ${s === "OS" ? tc("product.oneSize") : s}`, href: without("size", s) }));
  filters.colors.forEach((c) => chips.push({ label: colorName.get(c) ?? c, href: without("color", c) }));
  filters.brands.forEach((b) => chips.push({ label: brandName.get(b) ?? b, href: without("brand", b) }));
  if (filters.min) chips.push({ label: `≥ ${formatPrice(filters.min, locale)}`, href: href({ min: null }) });
  if (filters.max) chips.push({ label: `≤ ${formatPrice(filters.max, locale)}`, href: href({ max: null }) });
  if (filters.available) chips.push({ label: t("inStockOnly"), href: href({ available: null }) });
  if (filters.sale) chips.push({ label: t("saleOnly"), href: href({ sale: null }) });
  if (filters.isNew) chips.push({ label: t("newOnly"), href: href({ new: null }) });
  if (filters.q && basePath !== "/search") chips.push({ label: `“${filters.q}”`, href: href({ q: null }) });

  const keep = Object.fromEntries(Object.entries(query).filter(([k]) => (basePath === "/search" && k === "q") || k === "sort"));
  const clearHref = `${basePath}${Object.keys(keep).length ? `?${new URLSearchParams(keep)}` : ""}`;

  const filterCategories = tree.map((c) => ({ slug: c.slug, name: c.name, count: c.count, children: c.children.map((ch) => ({ slug: ch.slug, name: ch.name, count: ch.count })) }));

  return (
    <div className="container-luxe pb-24">
      {intro}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <p className="text-2xs font-medium uppercase tracking-wide2 text-ink-soft" aria-live="polite">{t("count", { count: result.total })}</p>
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <CatalogFilters basePath={basePath} query={query} facets={result.facets} categories={filterCategories} total={result.total} hide={hide} />
          </div>
          <SortSelect basePath={basePath} query={query} />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4" aria-label={t("activeFilters")}>
          {chips.map((c) => (
            <Link key={c.href + c.label} href={c.href} scroll={false} className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-xs hover:border-obsidian" aria-label={t("removeFilter", { label: c.label })}>
              {c.label} <CloseIcon size={12} />
            </Link>
          ))}
          <Link href={clearHref} scroll={false} className="px-2 text-xs underline underline-offset-4">{t("clearAll")}</Link>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr] xl:grid-cols-[250px_1fr]">
        <div className="hidden lg:block">
          <CatalogFilters basePath={basePath} query={query} facets={result.facets} categories={filterCategories} total={result.total} hide={hide} />
        </div>
        <div>
          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-24 text-center">
              <h2 className="font-serif text-3xl font-light">{t("empty.title")}</h2>
              <p className="mt-3 max-w-sm text-sm text-ink-soft">{t("empty.text")}</p>
              <Link href={clearHref} className="btn-dark mt-8">{t("empty.reset")}</Link>
            </div>
          ) : (
            <>
              <ProductGrid products={result.items} priorityCount={4} columns={3} />
              <div className="mt-16 flex flex-col items-center gap-4">
                <p className="text-xs text-ink-soft">{t("showing", { shown: result.items.length, total: result.total })}</p>
                <div className="h-px w-48 bg-line"><div className="h-px bg-obsidian" style={{ width: `${(result.items.length / result.total) * 100}%` }} /></div>
                {result.page < result.pages && (
                  <Link href={href({ page: String(result.page + 1) })} scroll={false} className="btn-outline mt-2">{t("loadMore")}</Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
