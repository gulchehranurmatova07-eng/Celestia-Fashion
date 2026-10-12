import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { PasswordForm, ProfileForm } from "@/components/account/ProfileForms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.profile" });
  return pageMetadata({ title: t("title"), path: "/account/profile", locale, noindex: true });
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("account.profile");
  return (
    <div className="space-y-14">
      <section><h2 className="mb-6 font-serif text-3xl">{t("title")}</h2><ProfileForm user={user} /></section>
      <section><h2 className="mb-6 font-serif text-3xl">{t("passwordTitle")}</h2><PasswordForm /></section>
    </div>
  );
}
