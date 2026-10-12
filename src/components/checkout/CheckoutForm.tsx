"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { placeOrderAction, type CheckoutPayload } from "@/app/actions/checkout";
import { checkDiscountAction, type DiscountCheck } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import { UZ_REGIONS } from "@/lib/regions";

type Address = { id: string; fullName: string; phone: string; country: string; region: string; city: string; line1: string; line2: string | null; postalCode: string | null; isDefault: boolean };

type Props = {
  user: { name: string; email: string; phone: string | null } | null;
  addresses: Address[];
  deliveryMethods: string[];
  paymentMethods: string[];
  shipping: { courierTashkent: number; courierRegions: number; freeThreshold: number; pickupAddress: string };
};

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block">
        <span className="field-label">{label}</span>
        {children}
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function CheckoutForm({ user, addresses, deliveryMethods, paymentMethods, shipping }: Props) {
  const t = useTranslations("checkout");
  const tcart = useTranslations("cart");
  const tc = useTranslations("common.product");
  const locale = useLocale();
  const router = useRouter();
  const { lines, details, detailsLoaded, subtotal, discountCode, setDiscountCode, setQuantity, removeItem, clearCart } = useStore();
  const [pending, start] = useTransition();

  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string>(def?.id ?? "new");
  const [f, setF] = useState({
    fullName: def?.fullName ?? user?.name ?? "",
    email: user?.email ?? "",
    phone: def?.phone ?? user?.phone ?? "+998 ",
    country: "UZ",
    region: def?.region ?? "TASHKENT_CITY",
    city: def?.city ?? "",
    line1: def?.line1 ?? "",
    line2: def?.line2 ?? "",
    postalCode: def?.postalCode ?? "",
    notes: "",
  });
  const [delivery, setDelivery] = useState<string>(f.region === "TASHKENT_CITY" ? "COURIER_TASHKENT" : "COURIER_REGIONS");
  const [payment, setPayment] = useState<string>(paymentMethods[0] ?? "");
  const [terms, setTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(Boolean(user) && addresses.length === 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [check, setCheck] = useState<DiscountCheck | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (delivery === "COURIER_TASHKENT" && f.region !== "TASHKENT_CITY") setDelivery("COURIER_REGIONS");
    if (delivery === "COURIER_REGIONS" && f.region === "TASHKENT_CITY") setDelivery("COURIER_TASHKENT");
  }, [f.region, delivery]);

  const key = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  useEffect(() => {
    if (!discountCode || !lines.length) return setCheck(null);
    checkDiscountAction(discountCode, lines).then(setCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, key]);

  const applyAddress = (id: string) => {
    setAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (a) setF((s) => ({ ...s, fullName: a.fullName, phone: a.phone, region: a.region, city: a.city, line1: a.line1, line2: a.line2 ?? "", postalCode: a.postalCode ?? "" }));
  };

  const discount = check?.ok ? check.amount : 0;
  const afterDiscount = subtotal - discount;
  const ship =
    delivery === "PICKUP" ? 0
    : shipping.freeThreshold > 0 && afterDiscount >= shipping.freeThreshold ? 0
    : delivery === "COURIER_TASHKENT" ? shipping.courierTashkent : shipping.courierRegions;
  const total = afterDiscount + ship;

  if (!detailsLoaded) return <p className="py-24 text-center text-sm text-ink-soft">{tcart("loading")}</p>;
  if (!lines.length) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-serif text-3xl">{t("emptyCart")}</p>
        <Link href="/catalog" className="btn-dark mt-8">{tcart("startShopping")}</Link>
      </div>
    );
  }

  const errText = (k: string) => (errors[k] ? t(`errors.${errors[k] === "email" ? "email" : errors[k] === "phone" ? "phone" : "required"}`) : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!terms) {
      setFormError(t("termsRequired"));
      return;
    }
    const payload: CheckoutPayload = {
      ...f,
      country: "UZ",
      region: f.region as CheckoutPayload["region"],
      line2: f.line2 || undefined,
      postalCode: f.postalCode || undefined,
      notes: f.notes || undefined,
      deliveryMethod: delivery as CheckoutPayload["deliveryMethod"],
      paymentMethod: payment as CheckoutPayload["paymentMethod"],
      discountCode: check?.ok ? check.code : undefined,
      terms: true,
      saveAddress: addressId === "new" && saveAddress,
      locale: locale as CheckoutPayload["locale"],
      lines,
    };
    start(async () => {
      const res = await placeOrderAction(payload);
      if (res.ok) {
        clearCart();
        router.push(`/order/${res.number}?token=${encodeURIComponent(res.token)}`);
        return;
      }
      if (res.error === "validation") {
        setErrors(res.fields);
        setFormError(t("errors.generic"));
        document.querySelector<HTMLElement>(`[name="${Object.keys(res.fields)[0]}"]`)?.focus();
      } else if (res.error === "stock") {
        for (const i of res.issues) {
          if (i.available > 0) setQuantity(i.variantId, i.available);
          else removeItem(i.variantId);
        }
        setFormError(t("errors.stock"));
      } else if (res.error === "discount") {
        setDiscountCode("");
        setFormError(t("errors.discount"));
      } else if (res.error === "method") setFormError(t("errors.method"));
      else if (res.error === "payment") setFormError(t("errors.payment"));
      else if (res.error === "terms") setFormError(t("termsRequired"));
      else setFormError(t("errors.generic"));
    });
  };

  const radio = (checked: boolean) =>
    clsx("flex cursor-pointer items-start gap-3 border p-4 transition-colors", checked ? "border-obsidian" : "border-line hover:border-ink-faint");

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_420px]">
      <div className="space-y-12">
        <section aria-labelledby="co-contact">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 id="co-contact" className="font-serif text-2xl">1. {t("contact")}</h2>
            {!user && (
              <p className="text-xs text-ink-soft">
                {t("signInPrompt")} <Link href="/login?next=/checkout" className="underline underline-offset-4">{t("signIn")}</Link>
              </p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("email")} error={errText("email")}>
              <input name="email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} className="field" aria-invalid={Boolean(errors.email)} />
            </Field>
            <Field label={t("phone")} error={errText("phone")}>
              <input name="phone" type="tel" autoComplete="tel" required value={f.phone} onChange={set("phone")} className="field" aria-invalid={Boolean(errors.phone)} aria-describedby="phone-hint" />
              <span id="phone-hint" className="mt-1 block text-[11px] text-ink-faint">{t("phoneHint")}</span>
            </Field>
          </div>
          {!user && <p className="mt-3 text-xs text-ink-faint">{t("guest")}</p>}
        </section>

        <section aria-labelledby="co-address">
          <h2 id="co-address" className="mb-5 font-serif text-2xl">2. {t("delivery")}</h2>
          {addresses.length > 0 && (
            <div className="mb-6 grid gap-2">
              {addresses.map((a) => (
                <label key={a.id} className={radio(addressId === a.id)}>
                  <input type="radio" name="savedAddress" checked={addressId === a.id} onChange={() => applyAddress(a.id)} className="mt-1 accent-obsidian" />
                  <span className="text-sm">
                    <span className="block font-medium">{a.fullName}</span>
                    <span className="text-ink-soft">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {t(`regions.${a.region}`)}</span>
                  </span>
                </label>
              ))}
              <label className={radio(addressId === "new")}>
                <input type="radio" name="savedAddress" checked={addressId === "new"} onChange={() => setAddressId("new")} className="mt-1 accent-obsidian" />
                <span className="text-sm">{t("newAddress")}</span>
              </label>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("fullName")} error={errText("fullName")} className="sm:col-span-2">
              <input name="fullName" autoComplete="name" required value={f.fullName} onChange={set("fullName")} className="field" aria-invalid={Boolean(errors.fullName)} />
            </Field>
            <Field label={t("country")}>
              <select name="country" value={f.country} onChange={set("country")} className="field" autoComplete="country">
                <option value="UZ">{t("countries.UZ")}</option>
              </select>
            </Field>
            <Field label={t("region")} error={errText("region")}>
              <select name="region" value={f.region} onChange={set("region")} className="field" autoComplete="address-level1">
                {UZ_REGIONS.map((r) => <option key={r} value={r}>{t(`regions.${r}`)}</option>)}
              </select>
            </Field>
            <Field label={t("city")} error={errText("city")}>
              <input name="city" autoComplete="address-level2" required value={f.city} onChange={set("city")} className="field" aria-invalid={Boolean(errors.city)} />
            </Field>
            <Field label={t("postalCode")}>
              <input name="postalCode" autoComplete="postal-code" value={f.postalCode} onChange={set("postalCode")} className="field" />
            </Field>
            <Field label={t("line1")} error={errText("line1")} className="sm:col-span-2">
              <input name="line1" autoComplete="address-line1" required value={f.line1} onChange={set("line1")} className="field" aria-invalid={Boolean(errors.line1)} />
            </Field>
            <Field label={t("line2")} className="sm:col-span-2">
              <input name="line2" autoComplete="address-line2" value={f.line2} onChange={set("line2")} className="field" />
            </Field>
            <Field label={t("notes")} className="sm:col-span-2">
              <textarea name="notes" rows={3} value={f.notes} onChange={set("notes")} className="field h-auto py-3" />
            </Field>
          </div>
          {user && addressId === "new" && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-obsidian" />
              {t("saveAddress")}
            </label>
          )}
        </section>

        <section aria-labelledby="co-method">
          <h2 id="co-method" className="mb-5 font-serif text-2xl">3. {t("deliveryMethod")}</h2>
          <div className="grid gap-2">
            {deliveryMethods.map((m) => {
              const disabled = m === "COURIER_TASHKENT" ? f.region !== "TASHKENT_CITY" : m === "COURIER_REGIONS" ? f.region === "TASHKENT_CITY" : false;
              const cost = m === "PICKUP" ? 0 : m === "COURIER_TASHKENT" ? shipping.courierTashkent : shipping.courierRegions;
              return (
                <label key={m} className={clsx(radio(delivery === m), disabled && "cursor-not-allowed opacity-45")}>
                  <input type="radio" name="deliveryMethod" value={m} disabled={disabled} checked={delivery === m} onChange={() => setDelivery(m)} className="mt-1 accent-obsidian" />
                  <span className="flex flex-1 justify-between gap-4 text-sm">
                    <span>
                      <span className="block font-medium">{t(`methods.${m}`)}</span>
                      <span className="text-xs text-ink-soft">{t(`methods.${m}_note`)}{m === "PICKUP" && shipping.pickupAddress ? ` — ${shipping.pickupAddress}` : ""}</span>
                    </span>
                    <span>{cost === 0 || (shipping.freeThreshold > 0 && afterDiscount >= shipping.freeThreshold) ? tcart("free") : formatPrice(cost, locale)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="co-pay">
          <h2 id="co-pay" className="mb-5 font-serif text-2xl">4. {t("payment")}</h2>
          {paymentMethods.length === 0 ? (
            <p className="border border-line p-4 text-sm text-ink-soft">{t("noPaymentMethods")}</p>
          ) : (
            <div className="grid gap-2">
              {paymentMethods.map((p) => (
                <label key={p} className={radio(payment === p)}>
                  <input type="radio" name="paymentMethod" value={p} checked={payment === p} onChange={() => setPayment(p)} className="mt-1 accent-obsidian" />
                  <span className="text-sm">
                    <span className="block font-medium">{t(`payments.${p}`)}</span>
                    {p === "COD" && <span className="text-xs text-ink-soft">{t("payments.COD_note")}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-ink-faint">{t("paymentSecurity")}</p>
        </section>
      </div>

      <aside className="h-fit bg-ivory p-6 md:p-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">{t("summary")}</h2>
          <Link href="/cart" className="text-xs underline underline-offset-4">{t("edit")}</Link>
        </div>
        <ul className="mt-6 space-y-4">
          {lines.map((l) => {
            const d = details[l.variantId];
            if (!d) return null;
            return (
              <li key={l.variantId} className="flex gap-3 text-sm">
                <div className="relative aspect-product w-14 shrink-0 bg-[#141414]">
                  {d.image && <Image src={d.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-obsidian px-1 text-[10px] text-ivory">{l.quantity}</span>
                </div>
                <div className="flex-1">
                  <p className="leading-snug">{d.name}</p>
                  <p className="text-xs text-ink-soft">{d.colorName} · {d.size === "OS" ? tc("oneSize") : d.size}</p>
                </div>
                <p>{formatPrice(d.price * l.quantity, locale)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between"><dt>{tcart("subtotal")}</dt><dd>{formatPrice(subtotal, locale)}</dd></div>
          {discount > 0 && check?.ok && (
            <div className="flex justify-between text-[#8E1B22]"><dt>{tcart("discount")} ({check.code})</dt><dd>−{formatPrice(discount, locale)}</dd></div>
          )}
          <div className="flex justify-between"><dt>{tcart("shipping")}</dt><dd>{ship === 0 ? tcart("free") : formatPrice(ship, locale)}</dd></div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-medium"><dt>{tcart("grandTotal")}</dt><dd>{formatPrice(total, locale)}</dd></div>
        </dl>

        <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-ink-soft">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-obsidian" required />
          <span>
            {t.rich("terms", {
              terms: (chunks) => <Link href="/terms" target="_blank" className="underline">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy" target="_blank" className="underline">{chunks}</Link>,
            })}
          </span>
        </label>
        <p role="alert" className="mt-4 min-h-5 text-xs text-[#9B1C1C]">{formError}</p>
        <button type="submit" disabled={pending || paymentMethods.length === 0} className="btn-dark mt-2 w-full">
          {pending ? t("placing") : `${t("placeOrder")} · ${formatPrice(total, locale)}`}
        </button>
      </aside>
    </form>
  );
}
