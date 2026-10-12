"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { Dialog } from "@/components/ui/Dialog";
import { CloseIcon } from "@/components/ui/Icons";
import { PurchasePanel } from "@/components/pdp/PurchasePanel";
import type { ProductDetail } from "@/lib/catalog";

export function QuickViewDialog() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { quickView, setQuickView } = useStore();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!quickView) return;
    setProduct(null);
    setFailed(false);
    fetch(`/api/product?locale=${locale}&slug=${encodeURIComponent(quickView)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { product: ProductDetail }) => {
        setProduct(d.product);
        setColor(d.product.colors[0]?.slug ?? null);
        setActive(0);
      })
      .catch(() => setFailed(true));
  }, [quickView, locale]);

  const images = useMemo(() => {
    if (!product) return [];
    const f = product.images.filter((i) => i.color === color);
    return f.length ? f : product.images;
  }, [product, color]);

  const close = () => setQuickView(null);

  return (
    <Dialog open={Boolean(quickView)} onClose={close} label={product?.name ?? t("product.quickView")} variant="center">
      <div className="relative max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={close} aria-label={t("actions.close")} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-white"><CloseIcon /></button>
        {failed ? (
          <p className="p-10 text-sm">{t("errors.generic")}</p>
        ) : !product ? (
          <div className="grid min-h-[60vh] place-items-center text-sm text-ink-soft">{t("actions.loading")}</div>
        ) : (
          <div className="grid md:grid-cols-2">
            <div>
              <div className="relative aspect-product bg-[#141414]">
                {images[active] && <Image src={images[active].url} alt={images[active].alt || product.name} fill sizes="(min-width: 768px) 540px, 100vw" className="object-cover" />}
              </div>
              {images.length > 1 && (
                <div className="flex gap-1 p-1">
                  {images.map((img, i) => (
                    <button key={img.url} type="button" onClick={() => setActive(i)} aria-label={t("product.next")} aria-pressed={i === active} className={`relative aspect-product w-14 bg-[#141414] ${i === active ? "outline outline-1 outline-obsidian" : "opacity-70"}`}>
                      <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 md:p-10">
              <PurchasePanel product={product} color={color} onColorChange={(c) => { setColor(c); setActive(0); }} headingLevel="h2" onAdded={close} />
              <Link href={`/product/${product.slug}`} onClick={close} className="eyebrow link-underline mt-2 inline-block">{t("product.viewDetails")}</Link>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
