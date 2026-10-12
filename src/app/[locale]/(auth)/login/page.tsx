import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AuthForms";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.login" });
  return pageMetadata({ title: t("title"), path: "/login", locale, noindex: true });
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const user = await getCurrentUser();
  if (user) redirect(safe ?? (locale === "en" ? "/account" : `/${locale}/account`));
  const t = await getTranslations("account.login");
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <LoginForm next={safe} />
    </AuthShell>
  );
}
