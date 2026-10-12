import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { CartPageClient } from "@/components/checkout/CartPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return pageMetadata({ title: t("title"), path: "/cart", locale, noindex: true });
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();
  return (
    <div className="container-luxe py-12 md:py-16">
      <CartPageClient freeThreshold={settings.shipping.freeThreshold} />
    </div>
  );
}
