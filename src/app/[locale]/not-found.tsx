import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("common.errors");
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow mb-4 text-ink-faint">404</p>
      <h1 className="heading-display text-5xl md:text-6xl">{t("notFoundTitle")}</h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft">{t("notFoundText")}</p>
      <Link href="/" className="btn-dark mt-10">{t("backHome")}</Link>
    </div>
  );
}
