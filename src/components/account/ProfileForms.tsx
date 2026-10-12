"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePasswordAction, updateProfileAction, type FormState } from "@/app/actions/auth";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; locale: string } }) {
  const t = useTranslations("account.profile");
  const te = useTranslations("checkout.errors");
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const err = (k: string) => (state.fields?.[k] ? (state.fields[k] === "taken" ? t("emailTaken") : te("required")) : null);
  return (
    <form action={action} className="grid max-w-xl gap-5" noValidate>
      <div><label htmlFor="p-name" className="field-label">{t("name")}</label><input id="p-name" name="name" defaultValue={user.name} autoComplete="name" className="field" />{err("name") && <p className="field-error">{err("name")}</p>}</div>
      <div><label htmlFor="p-email" className="field-label">{t("email")}</label><input id="p-email" name="email" type="email" defaultValue={user.email} autoComplete="email" className="field" />{err("email") && <p className="field-error">{err("email")}</p>}</div>
      <div><label htmlFor="p-phone" className="field-label">{t("phone")}</label><input id="p-phone" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" className="field" /></div>
      <div>
        <label htmlFor="p-locale" className="field-label">{t("language")}</label>
        <select id="p-locale" name="locale" defaultValue={user.locale} className="field">
          <option value="en">English</option><option value="ru">Русский</option><option value="uz">O‘zbekcha</option>
        </select>
      </div>
      <p role="status" className="min-h-5 text-xs">{state.success && t("saved")}</p>
      <button type="submit" disabled={pending} className="btn-dark justify-self-start">{t("save")}</button>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("account.profile");
  const tr = useTranslations("account.register");
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="grid max-w-xl gap-5" noValidate>
      <div><label htmlFor="pw-cur" className="field-label">{t("currentPassword")}</label><input id="pw-cur" name="current" type="password" autoComplete="current-password" className="field" />{state.fields?.current && <p className="field-error">{t("wrongPassword")}</p>}</div>
      <div><label htmlFor="pw-new" className="field-label">{t("newPassword")}</label><input id="pw-new" name="password" type="password" autoComplete="new-password" className="field" aria-describedby="pw-hint" /><p id="pw-hint" className="mt-1.5 text-[11px] text-ink-faint">{tr("passwordHint")}</p>{state.fields?.password && <p className="field-error">{tr("weak")}</p>}</div>
      <p role="status" className="min-h-5 text-xs">{state.success && t("passwordUpdated")}</p>
      <button type="submit" disabled={pending} className="btn-outline justify-self-start">{t("updatePassword")}</button>
    </form>
  );
}
