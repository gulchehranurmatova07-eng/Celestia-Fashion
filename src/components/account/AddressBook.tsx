"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/app/actions/addresses";
import type { FormState } from "@/app/actions/auth";
import { UZ_REGIONS } from "@/lib/regions";

type Address = { id: string; fullName: string; phone: string; region: string; city: string; line1: string; line2: string | null; postalCode: string | null; isDefault: boolean };

function AddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const t = useTranslations("checkout");
  const ta = useTranslations("account.addresses");
  const tc = useTranslations("common.actions");
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveAddressAction(prev, fd);
    if (res.success) onDone();
    return res;
  }, {});
  const err = (k: string) => state.fields?.[k] && <p className="field-error">{t("errors.required")}</p>;
  return (
    <form action={action} className="grid gap-4 border border-line p-6 sm:grid-cols-2" noValidate>
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-2"><label htmlFor="a-name" className="field-label">{t("fullName")}</label><input id="a-name" name="fullName" defaultValue={state.values?.fullName ?? address?.fullName} className="field" autoComplete="name" />{err("fullName")}</div>
      <div><label htmlFor="a-phone" className="field-label">{t("phone")}</label><input id="a-phone" name="phone" type="tel" defaultValue={state.values?.phone ?? address?.phone ?? "+998 "} className="field" autoComplete="tel" />{err("phone")}</div>
      <div><label htmlFor="a-region" className="field-label">{t("region")}</label><select id="a-region" name="region" defaultValue={state.values?.region ?? address?.region ?? "TASHKENT_CITY"} className="field">{UZ_REGIONS.map((r) => <option key={r} value={r}>{t(`regions.${r}`)}</option>)}</select></div>
      <div><label htmlFor="a-city" className="field-label">{t("city")}</label><input id="a-city" name="city" defaultValue={state.values?.city ?? address?.city} className="field" />{err("city")}</div>
      <div><label htmlFor="a-postal" className="field-label">{t("postalCode")}</label><input id="a-postal" name="postalCode" defaultValue={state.values?.postalCode ?? address?.postalCode ?? ""} className="field" /></div>
      <div className="sm:col-span-2"><label htmlFor="a-line1" className="field-label">{t("line1")}</label><input id="a-line1" name="line1" defaultValue={state.values?.line1 ?? address?.line1} className="field" />{err("line1")}</div>
      <div className="sm:col-span-2"><label htmlFor="a-line2" className="field-label">{t("line2")}</label><input id="a-line2" name="line2" defaultValue={state.values?.line2 ?? address?.line2 ?? ""} className="field" /></div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 accent-obsidian" />{ta("makeDefault")}</label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-dark">{tc("save")}</button>
        <button type="button" onClick={onDone} className="btn-outline">{tc("cancel")}</button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("account.addresses");
  const tc = useTranslations("checkout");
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      {addresses.length === 0 && editing === null && <p className="text-sm text-ink-soft">{t("empty")}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <li key={a.id} className="sm:col-span-2"><AddressForm address={a} onDone={() => setEditing(null)} /></li>
          ) : (
            <li key={a.id} className="flex flex-col border border-line p-6 text-sm">
              {a.isDefault && <span className="eyebrow mb-3 text-champagne-dark">{t("default")}</span>}
              <p className="font-medium">{a.fullName}</p>
              <p className="mt-1 leading-relaxed text-ink-soft">{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {tc(`regions.${a.region}`)}<br />{a.phone}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs">
                <button type="button" onClick={() => setEditing(a.id)} className="underline underline-offset-4">{t("edit")}</button>
                {!a.isDefault && <button type="button" disabled={pending} onClick={() => start(() => setDefaultAddressAction(a.id))} className="underline underline-offset-4">{t("makeDefault")}</button>}
                <button type="button" disabled={pending} onClick={() => { if (confirm(t("deleteConfirm"))) start(() => deleteAddressAction(a.id)); }} className="underline underline-offset-4">{t("delete")}</button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === "new" ? <AddressForm onDone={() => setEditing(null)} /> : <button type="button" onClick={() => setEditing("new")} className="btn-outline">{t("add")}</button>}
    </div>
  );
}
