import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { getCollections, newArrivals, trendingProducts } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "@/components/home/SectionHeading";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { Emblem } from "@/components/brand/Logo";
import { ArrowRight } from "@/components/ui/Icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.brand" });
  return pageMetadata({ title: `CELESTIA — ${t("slogan")}`, description: t("statement"), path: "/", locale });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const [t, tc, settings, arrivals, trending, collections] = await Promise.all([
    getTranslations("home"),
    getTranslations("common"),
    getSettings(),
    newArrivals(l, 8),
    trendingProducts(l, 12),
    getCollections(l),
  ]);
  const hero = settings.hero;

  const categoryCards = [
    { href: "/catalog?gender=men", label: t("categories.men"), img: "/images/looks/look-3.jpg", cls: "col-span-2 row-span-2 aspect-[3/4] md:aspect-auto" },
    { href: "/catalog?category=blazers", label: t("categories.tailoring"), img: "/images/looks/look-8.jpg", cls: "aspect-[3/4]" },
    { href: "/catalog?category=clothing", label: t("categories.clothing"), img: "/images/looks/look-7.jpg", cls: "aspect-[3/4]" },
    { href: "/catalog?category=shoes", label: t("categories.shoes"), img: "/images/products/oxfords-4.jpg", cls: "aspect-[3/4]" },
    { href: "/catalog?category=accessories", label: t("categories.accessories"), img: "/images/products/watch-strap-2.jpg", cls: "aspect-[3/4]" },
    { href: "/catalog?new=1", label: t("categories.newArrivals"), img: "/images/looks/look-16.jpg", cls: "col-span-2 aspect-[16/10] md:aspect-[16/9]" },
    { href: "/catalog?category=knitwear", label: t("categories.knitwear"), img: "/images/looks/look-13.jpg", cls: "col-span-2 aspect-[16/10] md:aspect-[16/9]" },
  ];

  return (
    <>
      {/* C. Cinematic hero campaign */}
      <section className="on-dark relative -mt-[var(--header-h)] h-[100svh] min-h-[560px] overflow-hidden bg-obsidian text-ivory">
        <div className="absolute inset-0 hidden grid-cols-3 md:grid">
          {hero.imageDesktop.slice(0, 3).map((src, i) => (
            <div key={src + i} className="relative overflow-hidden">
              <Image
                src={src}
                alt=""
                fill
                priority
                sizes="34vw"
                quality={85}
                className="animate-slow-zoom object-cover object-top"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 md:hidden">
          <Image src={hero.imageMobile} alt="" fill priority sizes="100vw" quality={85} className="animate-slow-zoom object-cover object-[50%_20%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
        <div className="container-luxe relative flex h-full flex-col items-center justify-end pb-20 text-center md:pb-24">
          <p className="eyebrow mb-5 animate-fade-up text-ivory/80">{t("hero.eyebrow")}</p>
          <h1 className="heading-display max-w-4xl animate-fade-up text-[3.1rem] [animation-delay:120ms] sm:text-7xl lg:text-[6.5rem]">
            {hero.title[l]}
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-sm leading-relaxed text-ivory/85 [animation-delay:240ms] md:text-base">
            {hero.subtitle[l]}
          </p>
          <div className="mt-10 flex w-full max-w-md animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:w-auto sm:max-w-none sm:flex-row">
            <Link href="/collections" className="btn-light">{t("hero.explore")}</Link>
            <Link href="/catalog?new=1" className="btn-outline-light">{t("hero.newArrivals")}</Link>
          </div>
        </div>
      </section>

      {/* D. Shop by category */}
      <section className="container-luxe py-20 md:py-28" aria-labelledby="cat-heading">
        <div className="mb-10 flex items-end justify-between" data-reveal>
          <div>
            <p className="eyebrow mb-3 text-ink-faint">{t("categories.eyebrow")}</p>
            <h2 id="cat-heading" className="heading-display text-4xl md:text-6xl">{t("categories.title")}</h2>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {categoryCards.map((c, i) => (
            <li key={c.href} className={`relative ${c.cls}`} data-reveal style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
              <Link href={c.href} className="group absolute inset-0 block overflow-hidden bg-[#141414] text-ivory on-dark">
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  className="object-cover object-top transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 md:p-6">
                  <span className={`heading-display ${i === 0 ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl"}`}>{c.label}</span>
                  <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide2 opacity-80 transition-all duration-500 group-hover:gap-3 group-hover:opacity-100">
                    <span className="hidden sm:inline">{t("categories.explore")}</span>
                    <ArrowRight size={16} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* E. New arrivals */}
      {arrivals.length > 0 && (
        <section className="container-luxe pb-20 md:pb-28">
          <SectionHeading
            eyebrow={t("newArrivals.eyebrow")}
            title={t("newArrivals.title")}
            action={<Link href="/catalog?new=1" className="eyebrow link-underline">{t("newArrivals.viewAll")}</Link>}
          />
          <ProductGrid products={arrivals} />
        </section>
      )}

      {/* F. Editorial campaign */}
      <section className="on-dark bg-obsidian text-ivory">
        <div className="container-luxe grid items-center gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="relative aspect-[4/5] overflow-hidden md:col-span-7 md:aspect-[5/6]" data-reveal>
            <Image src="/images/looks/look-11.jpg" alt="" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover object-top" />
          </div>
          <div className="relative md:col-span-5 md:-ml-24 md:pl-0" data-reveal>
            <div className="bg-obsidian/90 md:p-10">
              <p className="eyebrow mb-5 text-champagne">{t("editorial.eyebrow")}</p>
              <h2 className="heading-display text-5xl md:text-7xl">{t("editorial.title")}</h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/75 md:text-base">{t("editorial.text")}</p>
              <Link href="/collections/urban-elegance" className="btn-outline-light mt-10">{t("editorial.cta")}</Link>
            </div>
            <div className="relative ml-auto mt-10 hidden aspect-[3/4] w-40 overflow-hidden md:block">
              <Image src="/images/products/denim-jacket-3.jpg" alt="" fill sizes="160px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* G. Trending now */}
      {trending.length > 0 && (
        <section className="container-luxe py-20 md:py-28">
          <SectionHeading eyebrow={t("trending.eyebrow")} title={t("trending.title")} />
          <ProductCarousel products={trending} labels={{ prev: t("trending.prev"), next: t("trending.next"), region: t("trending.title") }} />
        </section>
      )}

      {/* H. Curated collections */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow={t("collections.eyebrow")}
            title={t("collections.title")}
            action={<Link href="/collections" className="eyebrow link-underline">{tc("nav.viewAll")}</Link>}
          />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
            {collections.filter((c) => c.count > 0).map((c, i) => (
              <li key={c.slug} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#141414]">
                    {c.image && <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 19vw, 48vw" className="object-cover object-top transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.04]" />}
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-light">{c.name}</h3>
                  <p className="mt-1 text-xs text-ink-faint">{t("collections.pieces", { count: c.count })}</p>
                  <span className="eyebrow link-underline mt-3 inline-block">{t("collections.discover")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* I. Brand story */}
      <section className="container-luxe grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-32">
        <div className="grid grid-cols-5 gap-3" data-reveal>
          <div className="relative col-span-3 aspect-[3/4] overflow-hidden bg-[#141414]">
            <Image src="/images/editorial/portrait-face.jpg" alt="" fill sizes="(min-width: 768px) 28vw, 60vw" className="object-cover" />
          </div>
          <div className="col-span-2 flex flex-col gap-3 pt-16">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#141414]">
              <Image src="/images/editorial/portrait-profile.jpg" alt="" fill sizes="(min-width: 768px) 18vw, 40vw" className="object-cover" />
            </div>
            <Emblem className="mx-auto mt-4 h-14 w-14 text-champagne-dark" />
          </div>
        </div>
        <div className="max-w-xl" data-reveal>
          <p className="eyebrow mb-4 text-ink-faint">{t("story.eyebrow")}</p>
          <h2 className="heading-display text-5xl md:text-7xl">{t("story.title")}</h2>
          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-soft">
            <p>{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
          </div>
          <dl className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            {(["curation", "quality", "service"] as const).map((k) => (
              <div key={k}>
                <dt className="font-serif text-xl">{t(`story.values.${k}`)}</dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-ink-faint">{t(`story.values.${k}Text`)}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="btn-outline mt-10">{t("story.cta")}</Link>
        </div>
      </section>

      {/* J. Newsletter */}
      <section className="border-t border-line bg-ivory">
        <div className="container-luxe flex flex-col items-center py-20 text-center md:py-28" data-reveal>
          <Emblem className="mb-6 h-10 w-10 text-champagne-dark" />
          <h2 className="heading-display max-w-2xl text-4xl md:text-6xl">{tc("newsletter.title")}</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{tc("newsletter.text")}</p>
          <div className="mt-10 w-full max-w-lg text-left">
            <NewsletterForm id="home-newsletter" />
          </div>
        </div>
      </section>
    </>
  );
}
