"use client";

import clsx from "clsx";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";
import { ArrowRight } from "@/components/ui/Icons";

export function NewsletterForm({ tone = "light", id = "newsletter" }: { tone?: "light" | "dark"; id?: string }) {
  const t = useTranslations("common.newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeAction, { status: "idle" });
  const dark = tone === "dark";
  const message =
    state.status === "success" ? t("success")
    : state.status === "already" ? t("already")
    : state.status === "invalid" ? t("invalidEmail")
    : state.status === "consent" ? t("consentRequired")
    : state.status === "error" ? t("error")
    : "";
  const ok = state.status === "success" || state.status === "already";

  return (
    <form action={action} className="w-full" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label htmlFor={`${id}-email`} className="sr-only">{t("email")}</label>
      <div className={clsx("flex items-center border-b", dark ? "border-ivory/50" : "border-obsidian")}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          placeholder={t("email")}
          aria-invalid={state.status === "invalid"}
          aria-describedby={`${id}-msg`}
          className={clsx("h-12 flex-1 bg-transparent text-sm outline-none", dark ? "placeholder:text-ivory/60" : "placeholder:text-ink-faint")}
        />
        <button type="submit" disabled={pending} className="flex h-12 items-center gap-2 text-2xs font-medium uppercase tracking-wide2 disabled:opacity-50">
          {t("submit")} <ArrowRight size={16} />
        </button>
      </div>
      <label className={clsx("mt-4 flex items-start gap-3 text-xs leading-relaxed", dark ? "text-ivory/75" : "text-ink-soft")}>
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-current" />
        <span>
          {t("consent")}{" "}
          <Link href="/privacy" className="underline underline-offset-2">→</Link>
        </span>
      </label>
      <p id={`${id}-msg`} role="status" className={clsx("mt-3 min-h-5 text-xs", ok ? "" : dark ? "text-[#f2b8b5]" : "text-[#9B1C1C]")}>
        {message}
      </p>
    </form>
  );
}
