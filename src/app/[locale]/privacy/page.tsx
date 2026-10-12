import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { ContentPage } from "@/components/layout/ContentPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.privacy" });
  return pageMetadata({ title: t("title"), description: t("meta"), path: "/privacy", locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const sections = t.raw("privacy.sections") as { h: string; p: string }[];
  return (
    <ContentPage title={t("privacy.title")} locale={locale}>
      <p className="mb-10 border-l-2 border-champagne bg-ivory px-5 py-4 text-xs leading-relaxed text-ink-soft">{t("legalDraft")}</p>
      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-3 font-serif text-2xl">{s.h}</h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">{s.p}</p>
          </section>
        ))}
      </div>
    </ContentPage>
  );
}
