import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { OrderDetail } from "@/components/account/OrderDetail";

type Props = { params: Promise<{ locale: string; number: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, number } = await params;
  return pageMetadata({ title: number, path: `/account/orders/${number}`, locale, noindex: true });
}

export default async function AccountOrderPage({ params }: Props) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  // Customers may only see their own orders.
  const order = await db.order.findFirst({ where: { number, userId: user.id }, include: { items: true } });
  if (!order) notFound();
  const t = await getTranslations("account.orders");
  return (
    <section>
      <Link href="/account/orders" className="text-xs underline underline-offset-4">← {t("back")}</Link>
      <h2 className="mt-4 font-serif text-3xl">{order.number}</h2>
      <p className="mb-8 mt-1 text-sm text-ink-soft">{t("placedOn", { date: formatDate(order.createdAt, locale) })}</p>
      <OrderDetail order={order} locale={locale} />
    </section>
  );
}
