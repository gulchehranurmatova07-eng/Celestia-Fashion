import { notFound } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { OrderDetail } from "@/components/account/OrderDetail";
import { CheckIcon } from "@/components/ui/Icons";

type Props = { params: Promise<{ locale: string; number: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, number } = await params;
  return pageMetadata({ title: number, path: `/order/${number}`, locale, noindex: true });
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const [order, user] = await Promise.all([db.order.findUnique({ where: { number }, include: { items: true } }), getCurrentUser()]);
  // Access: the guest's private link token, the owning customer, or an administrator.
  const allowed = order && ((token && safeEqual(token, order.accessToken)) || (user && (user.id === order.userId || user.role === "ADMIN")));
  if (!order || !allowed) notFound();

  const t = await getTranslations("checkout.confirmation");
  const devMode = !process.env.SMTP_HOST;
  return (
    <div className="container-luxe py-14 md:py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-obsidian"><CheckIcon size={26} /></span>
        <h1 className="heading-display text-5xl md:text-6xl">{t("title")}</h1>
        <p className="mt-5 text-sm leading-relaxed text-ink-soft">
          {devMode ? t("textDev", { number: order.number }) : t("text", { number: order.number, email: order.email })}
        </p>
        {order.paymentMethod === "COD" && (
          <div className="mt-8 border border-line p-5 text-left">
            <p className="eyebrow mb-2">{t("next")}</p>
            <p className="text-sm text-ink-soft">{t("nextCod")}</p>
          </div>
        )}
      </div>
      <h2 className="mb-6 font-serif text-3xl">{t("details")}</h2>
      <OrderDetail order={order} locale={locale} />
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/catalog" className="btn-dark">{t("continue")}</Link>
        {user ? (
          <Link href="/account/orders" className="btn-outline">{t("viewOrders")}</Link>
        ) : (
          <Link href="/register" className="btn-outline">{t("createAccount")}</Link>
        )}
      </div>
    </div>
  );
}
