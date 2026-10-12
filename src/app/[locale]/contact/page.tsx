import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/constants";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ContentPage } from "@/components/layout/ContentPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata({ title: t("title"), description: t("meta"), path: "/contact", locale });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, s] = await Promise.all([getTranslations("pages.contact"), getSettings()]);
  const l = locale as Locale;
  const placeholder = s.contact.email === DEFAULT_SETTINGS.contact.email || s.contact.phone === DEFAULT_SETTINGS.contact.phone;
  return (
    <ContentPage title={t("title")} locale={locale}>
      <p className="mb-12 text-[15px] leading-relaxed text-ink-soft">{t("intro")}</p>
      <dl className="grid gap-8 sm:grid-cols-2">
        <div><dt className="eyebrow mb-2">{t("email")}</dt><dd><a href={`mailto:${s.contact.email}`} className="link-underline font-serif text-2xl">{s.contact.email}</a></dd></div>
        <div><dt className="eyebrow mb-2">{t("phone")}</dt><dd><a href={`tel:${s.contact.phone.replace(/\s/g, "")}`} className="link-underline font-serif text-2xl">{s.contact.phone}</a></dd></div>
        <div><dt className="eyebrow mb-2">{t("address")}</dt><dd className="text-ink-soft">{s.contact.address[l]}</dd></div>
        <div><dt className="eyebrow mb-2">{t("hours")}</dt><dd className="text-ink-soft">{s.contact.hours[l]}</dd></div>
      </dl>
      {placeholder && <p className="mt-12 border-l-2 border-champagne bg-ivory px-5 py-4 text-xs text-ink-soft">{t("placeholderNotice")}</p>}
    </ContentPage>
  );
}
