import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AuthForms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.forgot" });
  return pageMetadata({ title: t("title"), path: "/forgot-password", locale, noindex: true });
}

export default async function ForgotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.forgot");
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} image="/images/looks/look-15.jpg">
      <ForgotForm />
    </AuthShell>
  );
}
