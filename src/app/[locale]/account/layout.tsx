import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(`${prefix}/account`)}`);
  const t = await getTranslations("account");
  return (
    <div className="container-luxe py-12 md:py-16">
      <p className="eyebrow mb-3 text-ink-faint">{t("title")}</p>
      <h1 className="heading-display mb-10 text-4xl md:text-6xl">{t("welcome", { name: user.name.split(" ")[0] })}</h1>
      <div className="grid gap-10 md:grid-cols-[200px_1fr] lg:gap-16">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
