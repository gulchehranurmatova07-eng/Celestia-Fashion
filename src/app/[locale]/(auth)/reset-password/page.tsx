import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.reset" });
  return pageMetadata({ title: t("title"), path: "/reset-password", locale, noindex: true });
}

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const t = await getTranslations("account.reset");
  return (
    <AuthShell title={t("title")} image="/images/looks/look-15.jpg">
      {token ? <ResetForm token={token} /> : <p className="text-sm">{t("invalid")} <Link href="/forgot-password" className="underline">→</Link></p>}
    </AuthShell>
  );
}
