import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { OrdersTable } from "@/components/account/OrdersTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return pageMetadata({ title: t("title"), path: "/account", locale, noindex: true });
}

export default async function AccountOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("account");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { _count: { select: { items: true } } } });
  const address = await db.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  const tc = await getTranslations("checkout");
  return (
    <div className="space-y-14">
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">{t("overview.recentOrders")}</h2>
          <Link href="/account/orders" className="text-xs underline underline-offset-4">{t("overview.viewAll")}</Link>
        </div>
        <OrdersTable orders={orders} locale={locale} />
      </section>
      <section className="grid gap-8 sm:grid-cols-2">
        <div className="border border-line p-6">
          <h2 className="eyebrow mb-4">{t("overview.details")}</h2>
          <p className="text-sm">{user.name}</p>
          <p className="text-sm text-ink-soft">{user.email}</p>
          {user.phone && <p className="text-sm text-ink-soft">{user.phone}</p>}
          <Link href="/account/profile" className="mt-4 inline-block text-xs underline underline-offset-4">{t("profile.title")}</Link>
        </div>
        <div className="border border-line p-6">
          <h2 className="eyebrow mb-4">{t("addresses.title")}</h2>
          {address ? (
            <p className="text-sm leading-relaxed text-ink-soft">{address.fullName}<br />{address.line1}, {address.city}<br />{tc(`regions.${address.region}`)}</p>
          ) : (
            <p className="text-sm text-ink-soft">{t("addresses.empty")}</p>
          )}
          <Link href="/account/addresses" className="mt-4 inline-block text-xs underline underline-offset-4">{t("addresses.add")}</Link>
        </div>
      </section>
    </div>
  );
}
