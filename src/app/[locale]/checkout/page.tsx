import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/constants";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { availableDeliveryMethods } from "@/lib/pricing";
import { availablePaymentMethods } from "@/lib/payments";
import { pageMetadata } from "@/lib/seo";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return pageMetadata({ title: t("title"), path: "/checkout", locale, noindex: true });
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user, settings] = await Promise.all([getTranslations("checkout"), getCurrentUser(), getSettings()]);
  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  return (
    <div className="container-luxe py-12 md:py-16">
      <h1 className="heading-display mb-10 text-5xl md:text-6xl">{t("title")}</h1>
      <CheckoutForm
        user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
        addresses={addresses}
        deliveryMethods={availableDeliveryMethods(settings)}
        paymentMethods={availablePaymentMethods(settings)}
        shipping={{
          courierTashkent: settings.shipping.courierTashkent,
          courierRegions: settings.shipping.courierRegions,
          freeThreshold: settings.shipping.freeThreshold,
          pickupAddress: settings.shipping.pickupAddress[locale as Locale],
        }}
      />
    </div>
  );
}
