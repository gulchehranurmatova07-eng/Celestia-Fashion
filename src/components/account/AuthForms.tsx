"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction, type FormState } from "@/app/actions/auth";

function Input({ label, name, type = "text", autoComplete, error, hint, defaultValue }: { label: string; name: string; type?: string; autoComplete?: string; error?: string; hint?: string; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} defaultValue={defaultValue} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined} className="field" />
      {hint && !error && <p id={`${name}-hint`} className="mt-1.5 text-[11px] text-ink-faint">{hint}</p>}
      {error && <p id={`${name}-err`} role="alert" className="field-error">{error}</p>}
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("account.login");
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Input label={t("email")} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} />
      <Input label={t("password")} name="password" type="password" autoComplete="current-password" />
      {state.error && <p role="alert" className="field-error">{t("invalid")}</p>}
      <button type="submit" disabled={pending} className="btn-dark w-full">{t("submit")}</button>
      <div className="flex flex-wrap justify-between gap-3 text-xs">
        <Link href="/forgot-password" className="underline underline-offset-4">{t("forgot")}</Link>
        <span>{t("noAccount")} <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="underline underline-offset-4">{t("create")}</Link></span>
      </div>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("account.register");
  const tc = useTranslations("checkout.errors");
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  const err = (k: string) => {
    const v = state.fields?.[k];
    if (!v) return undefined;
    if (v === "exists") return t("exists");
    if (v === "mismatch") return t("mismatch");
    if (v === "weak") return t("weak");
    return tc("required");
  };
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Input label={t("name")} name="name" autoComplete="name" error={err("name")} defaultValue={state.values?.name} />
      <Input label={t("email")} name="email" type="email" autoComplete="email" error={err("email")} defaultValue={state.values?.email} />
      <Input label={t("phone")} name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone} />
      <Input label={t("password")} name="password" type="password" autoComplete="new-password" hint={t("passwordHint")} error={err("password")} />
      <Input label={t("confirm")} name="confirm" type="password" autoComplete="new-password" error={err("confirm")} />
      <label className="flex items-center gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="newsletter" className="h-4 w-4 accent-obsidian" /> {t("newsletter")}
      </label>
      <button type="submit" disabled={pending} className="btn-dark w-full">{t("submit")}</button>
      <p className="text-xs">{t("haveAccount")} <Link href="/login" className="underline underline-offset-4">{t("signIn")}</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations("account.forgot");
  const tl = useTranslations("account.login");
  const tc = useTranslations("checkout.errors");
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  if (state.success) {
    return (
      <div className="space-y-4 text-sm" role="status">
        <p>{t("sent")}</p>
        {process.env.NODE_ENV !== "production" && <p className="text-xs text-ink-faint">{t("devNote")}</p>}
        <Link href="/login" className="btn-outline">{t("back")}</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      <Input label={tl("email")} name="email" type="email" autoComplete="email" error={state.fields?.email ? tc("email") : undefined} />
      <button type="submit" disabled={pending} className="btn-dark w-full">{t("submit")}</button>
      <Link href="/login" className="block text-xs underline underline-offset-4">{t("back")}</Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("account.reset");
  const tr = useTranslations("account.register");
  const tl = useTranslations("account.login");
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});
  if (state.success) {
    return (
      <div className="space-y-5 text-sm" role="status">
        <p>{t("success")}</p>
        <Link href="/login" className="btn-dark">{tl("submit")}</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <Input label={t("password")} name="password" type="password" autoComplete="new-password" hint={tr("passwordHint")} error={state.fields?.password ? tr("weak") : undefined} />
      <Input label={t("confirm")} name="confirm" type="password" autoComplete="new-password" error={state.fields?.confirm ? tr("mismatch") : undefined} />
      {state.error && <p role="alert" className="field-error">{t("invalid")}</p>}
      <button type="submit" disabled={pending} className="btn-dark w-full">{t("submit")}</button>
    </form>
  );
}
