import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { WishlistClient } from "@/components/account/WishlistClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.wishlist" });
  return pageMetadata({ title: t("title"), path: "/wishlist", locale, noindex: true });
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.wishlist");
  return (
    <div className="container-luxe py-12 md:py-16">
      <h1 className="heading-display mb-4 text-5xl md:text-6xl">{t("title")}</h1>
      <WishlistClient />
    </div>
  );
}
