import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { ContentPage } from "@/components/layout/ContentPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.shipping" });
  return pageMetadata({ title: t("title"), description: t("meta"), path: "/shipping-returns", locale });
}

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, s] = await Promise.all([getTranslations("pages.shipping"), getTranslations("checkout"), getSettings()]);
  const rows = [
    { m: "COURIER_TASHKENT", cost: s.shipping.courierTashkent },
    { m: "COURIER_REGIONS", cost: s.shipping.courierRegions },
    ...(s.shipping.pickupEnabled ? [{ m: "PICKUP", cost: 0 }] : []),
  ];
  return (
    <ContentPage title={t("title")} locale={locale}>
      <h2 className="mb-5 font-serif text-3xl">{t("deliveryTitle")}</h2>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-obsidian text-2xs uppercase tracking-wide2"><th className="py-3 font-medium">{t("table.method")}</th><th className="py-3 font-medium">{t("table.time")}</th><th className="py-3 text-right font-medium">{t("table.cost")}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.m} className="border-b border-line"><td className="py-4">{tc(`methods.${r.m}`)}</td><td className="py-4 text-ink-soft">{tc(`methods.${r.m}_note`)}</td><td className="py-4 text-right">{r.cost === 0 ? "—" : formatPrice(r.cost, locale)}</td></tr>
          ))}
        </tbody>
      </table>
      {s.shipping.freeThreshold > 0 && <p className="mt-4 text-sm text-ink-soft">{t("free", { threshold: formatPrice(s.shipping.freeThreshold, locale) })}</p>}
      <h2 className="mb-5 mt-14 font-serif text-3xl">{t("returnsTitle")}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
        <p>{t("returns1")}</p><p>{t("returns2")}</p><p>{t("returns3")}</p><p>{t("returns4")}</p>
      </div>
    </ContentPage>
  );
}
