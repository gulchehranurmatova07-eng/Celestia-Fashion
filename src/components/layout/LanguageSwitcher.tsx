"use client";

import clsx from "clsx";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { LOCALES, type Locale } from "@/lib/constants";
import { saveLocalePreference } from "@/app/actions/preferences";

const LABELS: Record<Locale, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  ru: { short: "RU", full: "Русский" },
  uz: { short: "UZ", full: "O‘zbekcha" },
};

/**
 * Switches language client-side: the current path, query (filters) and in-memory
 * state such as the bag are preserved, and the choice is remembered in a cookie.
 */
export function LanguageSwitcher({ className, signedIn }: { className?: string; signedIn?: boolean }) {
  const t = useTranslations("common.header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("language")} className={clsx("flex items-center", pending && "opacity-60", className)}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="px-1 opacity-40">/</span>}
          <button
            type="button"
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            aria-label={LABELS[l].full}
            onClick={() => {
              if (l === locale) return;
              const query = window.location.search;
              startTransition(() => {
                router.replace(`${pathname}${query}`, { locale: l, scroll: false });
              });
              if (signedIn) void saveLocalePreference(l);
            }}
            className={clsx(
              "px-0.5 py-1 text-[11px] font-medium tracking-wide2 transition-opacity",
              l === locale ? "opacity-100 underline underline-offset-4" : "opacity-60 hover:opacity-100",
            )}
          >
            {LABELS[l].short}
          </button>
        </span>
      ))}
    </div>
  );
}
