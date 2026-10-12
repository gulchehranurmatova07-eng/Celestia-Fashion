import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { AddressBook } from "@/components/account/AddressBook";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.addresses" });
  return pageMetadata({ title: t("title"), path: "/account/addresses", locale, noindex: true });
}

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("account.addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return (
    <section>
      <h2 className="mb-6 font-serif text-3xl">{t("title")}</h2>
      <AddressBook addresses={addresses} />
    </section>
  );
}
