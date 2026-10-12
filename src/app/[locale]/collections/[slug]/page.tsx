import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCollections, parseFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function find(slug: string, locale: string) {
  return (await getCollections(locale)).find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const c = await find(slug, locale);
  if (!c) return {};
  const sp = await searchParams;
  return pageMetadata({ title: c.name, description: c.description, path: `/collections/${slug}`, locale, image: c.image ?? undefined, noindex: Object.keys(sp).length > 0 });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = await find(slug, locale);
  if (!c) notFound();
  const sp = await searchParams;
  const t = await getTranslations("common.nav");
  const filters = { ...parseFilters(sp), collection: slug };

  return (
    <>
      <section className="on-dark relative -mt-[var(--header-h)] h-[70svh] min-h-[460px] overflow-hidden bg-obsidian text-ivory">
        {c.image && <Image src={c.image} alt="" fill priority sizes="100vw" className="animate-slow-zoom object-cover object-[50%_18%] opacity-80" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="container-luxe relative flex h-full flex-col justify-end pb-14">
          <p className="eyebrow mb-4 text-ivory/70">{t("collections")}</p>
          <h1 className="heading-display text-5xl md:text-8xl">{c.name}</h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ivory/80 md:text-base">{c.description}</p>
        </div>
      </section>
      <div className="container-luxe">
        <Breadcrumbs locale={locale} items={[{ label: t("collections"), href: "/collections" }, { label: c.name }]} />
      </div>
      <CatalogView basePath={`/collections/${slug}`} params={sp} filters={filters} locale={locale} />
    </>
  );
}
