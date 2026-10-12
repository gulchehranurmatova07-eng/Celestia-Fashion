import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug, relatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { localizedUrl, pageMetadata, SITE_URL } from "@/lib/seo";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductView } from "@/components/pdp/ProductView";
import { ProductGrid } from "@/components/product/ProductGrid";
import { RecentlyViewed } from "@/components/pdp/RecentlyViewed";
import { ChevronDown } from "@/components/ui/Icons";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ color?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug, locale);
  if (!p) return {};
  return pageMetadata({
    title: p.name,
    description: p.description.slice(0, 160),
    path: `/product/${slug}`,
    locale,
    image: p.images[0]?.url,
  });
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { color } = await searchParams;
  const [product, t, tc, settings] = await Promise.all([
    getProductBySlug(slug, locale),
    getTranslations("product"),
    getTranslations("common"),
    getSettings(),
  ]);
  if (!product) notFound();
  const related = await relatedProducts(product.id, locale, 4);

  const crumbs = [
    { label: tc("nav.catalog"), href: "/catalog" },
    ...(product.category.parent ? [{ label: product.category.parent.name, href: `/catalog?category=${product.category.parent.slug}` }] : []),
    { label: product.category.name, href: `/catalog?category=${product.category.slug}` },
    { label: product.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.slice(0, 4).map((i) => `${SITE_URL}${i.url}`),
    color: product.colors.map((c) => c.name).join(", "),
    offers: {
      "@type": "Offer",
      url: localizedUrl(`/product/${product.slug}`, locale),
      priceCurrency: "UZS",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const threshold = settings.shipping.freeThreshold;
  const sections = [
    { title: t("description"), body: <p>{product.description}</p>, open: true },
    { title: t("materials"), body: <><p>{product.materials}</p><p className="mt-3">{product.care}</p></> },
    {
      title: t("delivery"),
      body: <p>{threshold > 0 ? t("deliveryText", { threshold: formatPrice(threshold, locale) }) : t("deliveryTextNoFree")}</p>,
    },
  ];

  return (
    <>
      <div className="container-luxe">
        <Breadcrumbs locale={locale} items={crumbs} />
      </div>
      <div className="md:container-luxe">
        <ProductView product={product} initialColor={color}>
          <div className="mt-10 border-t border-line">
            {sections.map((s) => (
              <details key={s.title} open={s.open} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-2xs font-medium uppercase tracking-wide2 [&::-webkit-details-marker]:hidden">
                  {s.title}
                  <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-6 text-sm leading-relaxed text-ink-soft">{s.body}</div>
              </details>
            ))}
            <p className="pt-5 text-xs text-ink-faint">{t("sku", { sku: product.sku })}</p>
          </div>
        </ProductView>
      </div>

      {related.length > 0 && (
        <section className="container-luxe py-16 md:py-24">
          <h2 className="heading-display mb-10 text-4xl md:text-5xl">{t("related")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <RecentlyViewed productId={product.id} title={t("recentlyViewed")} labels={{ prev: tc("product.previous"), next: tc("product.next") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
