import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { ContentPage } from "@/components/layout/ContentPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return pageMetadata({ title: t("title"), description: t("meta"), path: "/about", locale });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, th, tc] = await Promise.all([getTranslations("pages.about"), getTranslations("home.story"), getTranslations("common")]);
  return (
    <ContentPage title={t("title")} locale={locale} wide>
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#141414]">
          <Image src="/images/editorial/hero-seated.jpg" alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="max-w-xl space-y-6 md:pt-10">
          <p className="font-serif text-3xl font-light italic text-champagne-dark">{tc("brand.slogan")}</p>
          <h2 className="heading-display text-5xl">{th("title")}</h2>
          <p className="text-[15px] leading-relaxed text-ink-soft">{th("p1")}</p>
          <p className="text-[15px] leading-relaxed text-ink-soft">{th("p2")}</p>
          <p className="text-[15px] leading-relaxed text-ink-soft">{th("p3")}</p>
          <dl className="grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            {(["curation", "quality", "service"] as const).map((k) => (
              <div key={k}><dt className="font-serif text-xl">{th(`values.${k}`)}</dt><dd className="mt-1.5 text-xs text-ink-faint">{th(`values.${k}Text`)}</dd></div>
            ))}
          </dl>
          <Link href="/collections" className="btn-dark">{tc("nav.collections")}</Link>
        </div>
      </div>
    </ContentPage>
  );
}
