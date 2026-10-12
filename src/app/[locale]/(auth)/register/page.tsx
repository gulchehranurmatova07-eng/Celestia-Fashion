import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/account/AuthShell";
import { RegisterForm } from "@/components/account/AuthForms";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.register" });
  return pageMetadata({ title: t("title"), path: "/register", locale, noindex: true });
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  if (await getCurrentUser()) redirect(locale === "en" ? "/account" : `/${locale}/account`);
  const t = await getTranslations("account.register");
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} image="/images/looks/look-14.jpg">
      <RegisterForm next={safe} />
    </AuthShell>
  );
}
