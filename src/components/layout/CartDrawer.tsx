"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { Dialog } from "@/components/ui/Dialog";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const t = useTranslations("common.cartDrawer");
  const tp = useTranslations("product");
  const tc = useTranslations("common.product");
  const locale = useLocale();
  const { cartOpen, setCartOpen, lines, details, detailsLoaded, subtotal, setQuantity, removeItem } = useStore();
  const close = () => setCartOpen(false);
  const visible = lines.filter((l) => details[l.variantId]);

  return (
    <Dialog open={cartOpen} onClose={close} label={t("title")} variant="right">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-2xl">{t("title")}</h2>
          <button type="button" onClick={close} aria-label={t("close")} className="-mr-2 p-2"><CloseIcon /></button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-serif text-2xl font-light">{t("empty")}</p>
            <Link href="/catalog" onClick={close} className="btn-dark">{t("continue")}</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {!detailsLoaded && <li className="py-6 text-sm text-ink-soft">…</li>}
              {visible.map((l) => {
                const d = details[l.variantId];
                return (
                  <li key={l.variantId} className="flex gap-4 py-5">
                    <Link href={`/product/${d.slug}`} onClick={close} className="relative aspect-product w-20 shrink-0 bg-[#141414]">
                      {d.image && <Image src={d.image} alt={d.name} fill sizes="80px" className="object-cover" />}
                    </Link>
                    <div className="flex flex-1 flex-col gap-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <Link href={`/product/${d.slug}`} onClick={close} className="leading-snug hover:underline">{d.name}</Link>
                        <span className="shrink-0">{formatPrice(d.price * l.quantity, locale)}</span>
                      </div>
                      <p className="text-xs text-ink-soft">
                        {d.colorName} · {d.size === "OS" ? tc("oneSize") : d.size}
                      </p>
                      {(!d.available || d.stock <= 0) && <p className="text-xs text-[#9B1C1C]">{tp("outOfStock")}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex h-9 items-center border border-line" role="group" aria-label={tp("quantity")}>
                          <button type="button" aria-label={tp("decrease")} onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="flex h-full w-9 items-center justify-center"><MinusIcon size={14} /></button>
                          <span className="w-7 text-center text-xs">{l.quantity}</span>
                          <button type="button" aria-label={tp("increase")} disabled={l.quantity >= d.stock} onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="flex h-full w-9 items-center justify-center disabled:opacity-30"><PlusIcon size={14} /></button>
                        </div>
                        <button type="button" onClick={() => removeItem(l.variantId)} className="text-xs text-ink-soft underline underline-offset-4 hover:text-ink">{t("remove")}</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-4 border-t border-line px-6 py-6">
              <div className="flex justify-between text-sm">
                <span className="eyebrow">{t("subtotal")}</span>
                <span>{formatPrice(subtotal, locale)}</span>
              </div>
              <p className="text-xs text-ink-soft">{t("taxNote")}</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/cart" onClick={close} className="btn-outline px-4">{t("viewBag")}</Link>
                <Link href="/checkout" onClick={close} className="btn-dark px-4">{t("checkout")}</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
