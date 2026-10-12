import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { OrdersTable } from "@/components/account/OrdersTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.orders" });
  return pageMetadata({ title: t("title"), path: "/account/orders", locale, noindex: true });
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("account.orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } });
  return (
    <section>
      <h2 className="mb-6 font-serif text-3xl">{t("title")}</h2>
      <OrdersTable orders={orders} locale={locale} />
    </section>
  );
}
