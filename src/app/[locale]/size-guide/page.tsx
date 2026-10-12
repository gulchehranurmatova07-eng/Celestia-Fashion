import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { ContentPage } from "@/components/layout/ContentPage";
import { SizeGuideTable } from "@/components/pdp/SizeGuideTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.sizeGuide" });
  return pageMetadata({ title: t("title"), description: t("meta"), path: "/size-guide", locale });
}

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tp] = await Promise.all([getTranslations("pages.sizeGuide"), getTranslations("product.sizeChart")]);
  return (
    <ContentPage title={t("title")} locale={locale}>
      <p className="mb-12 text-[15px] leading-relaxed text-ink-soft">{tp("intro")}</p>
      <div className="space-y-14">
        {(["tailoring", "tops", "trousers", "shoes"] as const).map((c) => <SizeGuideTable key={c} chart={c} caption={t(c)} />)}
      </div>
      <h2 className="mb-3 mt-14 font-serif text-2xl">{tp("howTo")}</h2>
      <ul className="space-y-2 text-sm text-ink-soft"><li>{tp("howToChest")}</li><li>{tp("howToWaist")}</li><li>{tp("howToFoot")}</li></ul>
    </ContentPage>
  );
}
