"use client";

import Image from "next/image";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ProductCard as Card } from "@/lib/catalog";
import { discountPercent } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";
import { BagIcon } from "@/components/ui/Icons";

export function ProductCard({ product, priority = false, sizes }: { product: Card; priority?: boolean; sizes?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const { addItem, toast, setCartOpen, setQuickView } = useStore();
  const [color, setColor] = useState(product.colors[0]?.slug ?? null);

  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.color === color);
    return forColor.length ? forColor : product.images;
  }, [product.images, color]);
  const primary = images[0];
  const secondary = images[1];
  const variantsForColor = product.variants.filter((v) => v.color === color);
  const pct = discountPercent(product.price, product.compareAtPrice);
  const linkHref = color && product.colors.length > 1 ? `/product/${product.slug}?color=${color}` : `/product/${product.slug}`;

  const quickAdd = (variantId: string, stock: number) => {
    const res = addItem(variantId, 1, stock);
    if (res === "none") toast(t("product.unavailable"));
    else toast(t("product.added"), { label: t("cartDrawer.viewBag"), onClick: () => setCartOpen(true) });
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-product overflow-hidden bg-[#141414]">
        <Link href={linkHref} aria-label={product.name} className="absolute inset-0 block" prefetch={false}>
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              priority={priority}
              sizes={sizes ?? "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"}
              className={clsx(
                "object-cover transition-[opacity,transform] duration-700 ease-luxe",
                secondary && "group-hover:opacity-0",
                !secondary && "group-hover:scale-[1.03]",
              )}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes={sizes ?? "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"}
              className="scale-[1.02] object-cover opacity-0 transition-[opacity,transform] duration-700 ease-luxe group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <span className="bg-ivory px-2 py-1 text-[10px] font-medium uppercase tracking-wide2 text-obsidian">{t("product.new")}</span>}
          {pct > 0 && <span className="bg-[#8E1B22] px-2 py-1 text-[10px] font-medium uppercase tracking-wide2 text-ivory">{t("product.discount", { percent: pct })}</span>}
          {!product.inStock && <span className="bg-obsidian/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wide2 text-ivory">{t("product.soldOut")}</span>}
        </div>

        <WishlistButton productId={product.id} className="absolute right-2 top-2 h-10 w-10 text-ivory on-dark" />

        {/* Quick add — revealed on hover/focus on pointer devices */}
        {product.inStock && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-2 bg-white/95 px-3 py-3 opacity-0 transition-all duration-500 ease-luxe group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wide2 text-ink-soft">{t("product.quickAdd")}</span>
              <button
                type="button"
                onClick={() => setQuickView(product.slug)}
                className="text-[10px] font-medium uppercase tracking-wide2 text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {t("product.quickView")}
              </button>
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label={t("product.selectSize")}>
              {variantsForColor.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock <= 0}
                  onClick={() => quickAdd(v.id, v.stock)}
                  aria-label={`${t("product.quickAdd")}: ${product.name}, ${v.size === "OS" ? t("product.oneSize") : v.size}`}
                  className="min-w-9 border border-line px-2 py-1.5 text-xs transition-colors hover:border-obsidian hover:bg-obsidian hover:text-ivory disabled:cursor-not-allowed disabled:text-ink-faint/60 disabled:line-through disabled:hover:border-line disabled:hover:bg-transparent"
                >
                  {v.size === "OS" ? t("product.oneSize") : v.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Touch devices: open quick view */}
        <button
          type="button"
          onClick={() => setQuickView(product.slug)}
          aria-label={`${t("product.quickView")}: ${product.name}`}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center bg-white/90 text-obsidian md:hidden"
        >
          <BagIcon size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3.5">
        <p className="text-[10px] uppercase tracking-wide2 text-ink-faint">{product.brand}</p>
        <h3 className="text-[13px] leading-snug text-ink">
          <Link href={linkHref} className="link-underline" prefetch={false}>
            {product.name}
          </Link>
        </h3>
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          locale={locale}
          className="text-[13px]"
          labels={{ original: t("product.originalPrice"), current: t("product.currentPrice") }}
        />
        {product.colors.length > 1 && (
          <div className="mt-1 flex items-center gap-1.5" role="group" aria-label={t("product.colors", { count: product.colors.length })}>
            {product.colors.map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-label={c.name}
                aria-pressed={color === c.slug}
                title={c.name}
                onClick={() => setColor(c.slug)}
                className={clsx(
                  "h-4 w-4 rounded-full border transition-shadow",
                  color === c.slug ? "border-obsidian shadow-[0_0_0_2px_white,0_0_0_3px_#111]" : "border-line",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
        {product.isDemo && <span className="sr-only">{t("product.demo")}</span>}
      </div>
    </article>
  );
}
