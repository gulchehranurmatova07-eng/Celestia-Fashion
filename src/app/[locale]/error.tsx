"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="heading-display text-5xl">{t("errors.errorTitle")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("errors.generic")}</p>
      <div className="mt-10 flex gap-3">
        <button type="button" onClick={reset} className="btn-dark">{t("actions.tryAgain")}</button>
        <Link href="/" className="btn-outline">{t("errors.backHome")}</Link>
      </div>
    </div>
  );
}
