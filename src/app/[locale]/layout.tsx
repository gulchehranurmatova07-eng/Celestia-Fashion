import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { serif, sans } from "../fonts";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getCategoryTree, getCollections } from "@/lib/catalog";
import { availablePaymentMethods } from "@/lib/payments";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { QuickViewDialog } from "@/components/layout/QuickViewDialog";
import { Toaster } from "@/components/layout/Toaster";
import { RevealObserver } from "@/components/layout/RevealObserver";

// Storefront pages read live inventory and the session cookie, so they render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.brand" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `CELESTIA — ${t("slogan")}`, template: "%s — CELESTIA" },
    description: t("statement"),
    applicationName: "CELESTIA",
  };
}

export const viewport: Viewport = { themeColor: "#111111", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;

  const [messages, user, settings, tree, collections, t] = await Promise.all([
    getMessages(),
    getCurrentUser(),
    getSettings(),
    getCategoryTree(l),
    getCollections(l),
    getTranslations("common"),
  ]);
  const wishlist = user
    ? (await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId)
    : [];
  const navCategories = tree.map((c) => ({ slug: c.slug, name: c.name, children: c.children.map((ch) => ({ slug: ch.slug, name: ch.name })) }));
  const navCollections = collections.filter((c) => c.count > 0).map((c) => ({ slug: c.slug, name: c.name, image: c.image }));
  const popular = [
    { label: t("nav.newArrivals"), href: "/catalog?new=1" },
    ...tree.flatMap((c) => c.children).slice(0, 6).map((c) => ({ label: c.name, href: `/catalog?category=${c.slug}` })),
  ];

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <StoreProvider signedIn={Boolean(user)} initialWishlist={wishlist}>
            <a href="#main" className="sr-only z-[70] bg-obsidian px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
              {t("nav.skipToContent")}
            </a>
            {settings.announcement.enabled && <AnnouncementBar text={settings.announcement.text[l]} href={settings.announcement.href} />}
            <Header categories={navCategories} collections={navCollections} signedIn={Boolean(user)} />
            <main id="main" className="min-h-[60vh]">{children}</main>
            <Footer settings={settings} locale={l} signedIn={Boolean(user)} codEnabled={availablePaymentMethods(settings).includes("COD")} />
            <CartDrawer />
            <SearchOverlay popular={popular} />
            <QuickViewDialog />
            <Toaster />
            <RevealObserver />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
