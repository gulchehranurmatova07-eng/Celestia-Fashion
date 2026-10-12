import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getCollections } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.nav" });
  return pageMetadata({ title: t("collections"), path: "/collections", locale });
}

export default async function CollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, th, collections] = await Promise.all([getTranslations("common.nav"), getTranslations("home.collections"), getCollections(locale)]);
  const visible = collections.filter((c) => c.count > 0);
  return (
    <div className="container-luxe pb-24">
      <Breadcrumbs locale={locale} items={[{ label: t("collections") }]} />
      <h1 className="heading-display pb-12 pt-2 text-5xl md:text-7xl">{t("collections")}</h1>
      <ul className="grid gap-x-4 gap-y-16 md:grid-cols-2">
        {visible.map((c, i) => (
          <li key={c.slug} className={i === 0 ? "md:col-span-2" : ""} data-reveal>
            <Link href={`/collections/${c.slug}`} className="group grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div className={`relative overflow-hidden bg-[#141414] ${i === 0 ? "aspect-[4/5] md:aspect-[16/11]" : "aspect-[4/5]"}`}>
                {c.image && <Image src={c.image} alt="" fill priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-top transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.03]" />}
              </div>
              <div className="md:pb-6">
                <p className="eyebrow mb-3 text-ink-faint">{th("pieces", { count: c.count })}</p>
                <h2 className="heading-display text-4xl md:text-5xl">{c.name}</h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">{c.description}</p>
                <span className="eyebrow link-underline mt-6 inline-block">{th("discover")}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
