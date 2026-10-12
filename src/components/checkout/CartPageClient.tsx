"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { checkDiscountAction, type DiscountCheck } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";

export function CartPageClient({ freeThreshold }: { freeThreshold: number }) {
  const t = useTranslations("cart");
  const tp = useTranslations("product");
  const tc = useTranslations("common.product");
  const tcd = useTranslations("common.cartDrawer");
  const locale = useLocale();
  const { lines, details, detailsLoaded, subtotal, setQuantity, removeItem, discountCode, setDiscountCode, toggleWish, isWished, toast } = useStore();
  const [code, setCode] = useState("");
  const [check, setCheck] = useState<DiscountCheck | null>(null);
  const [busy, setBusy] = useState(false);

  // Re-validate a stored code whenever the bag changes.
  const key = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  useEffect(() => {
    if (!discountCode || !lines.length) {
      setCheck(null);
      return;
    }
    checkDiscountAction(discountCode, lines).then(setCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, key]);

  // Clamp quantities to current stock.
  useEffect(() => {
    if (!detailsLoaded) return;
    for (const l of lines) {
      const d = details[l.variantId];
      if (d && d.stock > 0 && l.quantity > d.stock) {
        setQuantity(l.variantId, d.stock);
        toast(t("stockAdjusted", { count: d.stock }));
      }
    }
  }, [details, detailsLoaded, lines, setQuantity, toast, t]);

  if (!detailsLoaded) return <p className="py-24 text-center text-sm text-ink-soft">{t("loading")}</p>;

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <h1 className="heading-display text-5xl">{t("empty")}</h1>
        <p className="mt-4 text-sm text-ink-soft">{t("emptyText")}</p>
        <Link href="/catalog" className="btn-dark mt-10">{t("startShopping")}</Link>
      </div>
    );
  }

  const discount = check?.ok ? check.amount : 0;
  const after = subtotal - discount;
  const remaining = freeThreshold > 0 ? Math.max(0, freeThreshold - after) : null;

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const res = await checkDiscountAction(code.trim(), lines);
    setBusy(false);
    setCheck(res);
    if (res.ok) {
      setDiscountCode(res.code);
      setCode("");
    }
  };

  const promoError =
    check && !check.ok
      ? check.reason === "minimum"
        ? t("promoErrors.minimum", { amount: formatPrice(check.minSubtotal ?? 0, locale) })
        : t(`promoErrors.${check.reason}`)
      : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
      <div>
        <h1 className="heading-display mb-8 text-5xl md:text-6xl">{t("title")}</h1>
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => {
            const d = details[l.variantId];
            if (!d) {
              return (
                <li key={l.variantId} className="flex items-center justify-between py-6 text-sm">
                  <span className="text-ink-soft">{t("unavailable")}</span>
                  <button type="button" onClick={() => removeItem(l.variantId)} className="underline">{tcd("remove")}</button>
                </li>
              );
            }
            const unavailable = !d.available || d.stock <= 0;
            return (
              <li key={l.variantId} className="grid grid-cols-[96px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr]">
                <Link href={`/product/${d.slug}`} className="relative aspect-product bg-[#141414]">
                  {d.image && <Image src={d.image} alt={d.name} fill sizes="120px" className="object-cover" />}
                </Link>
                <div className="flex flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={`/product/${d.slug}`} className="font-serif text-xl leading-tight hover:underline">{d.name}</Link>
                      <p className="mt-1 text-xs text-ink-soft">{d.colorName} · {d.size === "OS" ? tc("oneSize") : d.size}</p>
                      <p className="mt-1 text-xs text-ink-soft">{formatPrice(d.price, locale)}</p>
                      {unavailable && <p className="mt-2 text-xs text-[#9B1C1C]">{t("unavailable")}</p>}
                    </div>
                    <p className="text-sm">{formatPrice(d.price * l.quantity, locale)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex h-10 items-center border border-line" role="group" aria-label={t("quantity")}>
                      <button type="button" aria-label={tp("decrease")} onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="flex h-full w-10 items-center justify-center"><MinusIcon size={14} /></button>
                      <span className="w-8 text-center text-sm">{l.quantity}</span>
                      <button type="button" aria-label={tp("increase")} disabled={l.quantity >= d.stock} onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="flex h-full w-10 items-center justify-center disabled:opacity-30"><PlusIcon size={14} /></button>
                    </div>
                    <div className="flex gap-5 text-xs">
                      {!isWished(d.productId) && (
                        <button type="button" onClick={() => { void toggleWish(d.productId); removeItem(l.variantId); toast(tc("wishlistAdded")); }} className="underline underline-offset-4">
                          {t("moveToWishlist")}
                        </button>
                      )}
                      <button type="button" onClick={() => { removeItem(l.variantId); toast(t("removed")); }} className="inline-flex items-center gap-1 underline underline-offset-4" aria-label={t("remove", { name: d.name })}>
                        <CloseIcon size={12} /> {tcd("remove")}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/catalog" className="eyebrow link-underline mt-8 inline-block">{t("continue")}</Link>
      </div>

      <aside className="h-fit bg-ivory p-6 md:p-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
        <h2 className="font-serif text-2xl">{t("summary")}</h2>
        {remaining !== null && (
          <div className="mt-5">
            <p className="text-xs text-ink-soft">{remaining > 0 ? t("freeShippingProgress", { amount: formatPrice(remaining, locale) }) : t("freeShippingReached")}</p>
            <div className="mt-2 h-px bg-line"><div className="h-px bg-obsidian transition-all" style={{ width: `${Math.min(100, (after / freeThreshold) * 100)}%` }} /></div>
          </div>
        )}
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd>{formatPrice(subtotal, locale)}</dd></div>
          {discount > 0 && check?.ok && (
            <div className="flex justify-between text-[#8E1B22]">
              <dt>{t("discount")} ({check.code})</dt>
              <dd>−{formatPrice(discount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between text-ink-soft"><dt>{t("shipping")}</dt><dd>{t("shippingCalculated")}</dd></div>
          <div className="flex justify-between border-t border-line pt-4 text-base"><dt>{t("grandTotal")}</dt><dd>{formatPrice(after, locale)}</dd></div>
        </dl>

        <form onSubmit={apply} className="mt-6">
          <label htmlFor="promo" className="field-label">{t("promo")}</label>
          <div className="flex gap-2">
            <input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("promoPlaceholder")} className="field h-11 uppercase" aria-describedby="promo-msg" />
            <button type="submit" disabled={busy} className="btn-outline h-11 px-5">{t("promoApply")}</button>
          </div>
          <p id="promo-msg" role="status" className="mt-2 min-h-5 text-xs">
            {check?.ok ? (
              <span className="flex items-center justify-between">
                {t("promoApplied", { code: check.code })}
                <button type="button" onClick={() => { setDiscountCode(""); setCheck(null); }} className="underline underline-offset-4">{t("promoRemove")}</button>
              </span>
            ) : (
              <span className="text-[#9B1C1C]">{promoError}</span>
            )}
          </p>
        </form>

        <Link href="/checkout" className="btn-dark mt-4 w-full">{t("checkout")}</Link>
        <ul className="mt-6 space-y-1.5 text-xs text-ink-soft">
          <li>— {t("secure")}</li>
          <li>— {t("returns")}</li>
        </ul>
      </aside>
    </div>
  );
}
