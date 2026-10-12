import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategoryName, parseFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";


type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function heading(locale: string, sp: Record<string, string | string[] | undefined>) {
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const f = parseFilters(sp);
  if (f.category) return (await getCategoryName(f.category, locale)) ?? t("title");
  if (f.sale) return tc("nav.sale");
  if (f.isNew) return tc("nav.newArrivals");
  if (f.gender) return t(`gender.${f.gender}`);
  return t("allProducts");
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const f = parseFilters(sp);
  // Canonical keeps only the primary landing dimension; deeper filter combinations are not indexed.
  const primary = new URLSearchParams();
  if (f.category) primary.set("category", f.category);
  if (f.gender) primary.set("gender", f.gender);
  const extra = Object.keys(sp).some((k) => !["category", "gender"].includes(k));
  return pageMetadata({
    title: await heading(locale, sp),
    description: t("metaDescription"),
    path: `/catalog${primary.size ? `?${primary}` : ""}`,
    locale,
    noindex: extra,
  });
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const t = await getTranslations("catalog");
  const title = await heading(locale, sp);

  return (
    <>
      <div className="container-luxe">
        <Breadcrumbs locale={locale} items={[{ label: t("title"), href: "/catalog" }, ...(title !== t("allProducts") ? [{ label: title }] : [])]} />
      </div>
      <CatalogView
        basePath="/catalog"
        params={sp}
        filters={filters}
        locale={locale}
        intro={
          <div className="pb-8 pt-2">
            <h1 className="heading-display text-5xl md:text-7xl">{title}</h1>
            {filters.gender === "women" && (
              <div className="mt-8 max-w-2xl border-l-2 border-champagne bg-ivory px-6 py-5">
                <p className="font-serif text-2xl">{t("womenNotice.title")}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("womenNotice.text")}</p>
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
