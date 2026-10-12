"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import type { ProductDetail } from "@/lib/catalog";
import { LOW_STOCK_THRESHOLD, sortSizes } from "@/lib/constants";
import { discountPercent, formatPrice } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import { Price } from "@/components/product/Price";
import { WishlistButton } from "@/components/product/WishlistButton";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { SizeGuideDialog } from "./SizeGuideDialog";

type Props = {
  product: ProductDetail;
  color: string | null;
  onColorChange: (slug: string) => void;
  headingLevel?: "h1" | "h2";
  onAdded?: () => void;
};

export function PurchasePanel({ product, color, onColorChange, headingLevel = "h1", onAdded }: Props) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { addItem, lines, toast, setCartOpen } = useStore();

  const sizes = useMemo(() => sortSizes([...new Set(product.variants.map((v) => v.size))]), [product.variants]);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.color === color && v.size === size) ?? null;
  const inBag = variant ? lines.find((l) => l.variantId === variant.id)?.quantity ?? 0 : 0;
  const maxQty = variant ? Math.max(0, variant.stock - inBag) : 0;
  const colorObj = product.colors.find((c) => c.slug === color);
  const pct = discountPercent(product.price, product.compareAtPrice);

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, maxQty || 1)));
  }, [maxQty]);

  const stockFor = (s: string) => product.variants.find((v) => v.color === color && v.size === s)?.stock ?? 0;
  const label = (s: string) => (s === "OS" ? tc("product.oneSize") : s);

  function add(): boolean {
    if (!size || !variant) {
      setError(t("selectSizeFirst"));
      return false;
    }
    if (variant.stock <= 0) {
      setError(t("outOfStock"));
      return false;
    }
    if (maxQty <= 0) {
      setError(t("alreadyInBag"));
      return false;
    }
    const res = addItem(variant.id, Math.min(qty, maxQty), variant.stock);
    if (res === "none") {
      setError(t("alreadyInBag"));
      return false;
    }
    setError(null);
    return true;
  }

  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-7">
      <div className="space-y-3">
        <p className="eyebrow text-ink-faint">{product.brand}</p>
        <Heading className="font-serif text-[2rem] font-light leading-tight md:text-[2.4rem]">{product.name}</Heading>
        <div className="flex flex-wrap items-center gap-3 text-base">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            locale={locale}
            labels={{ original: tc("product.originalPrice"), current: tc("product.currentPrice") }}
          />
          {pct > 0 && (
            <span className="bg-[#8E1B22] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide2 text-ivory">
              {tc("product.discount", { percent: pct })}
            </span>
          )}
        </div>
        {pct > 0 && product.compareAtPrice && (
          <p className="text-xs text-ink-soft">{t("savings", { amount: formatPrice(product.compareAtPrice - product.price, locale) })}</p>
        )}
        {product.isDemo && <p className="text-xs text-ink-faint">{t("demoNotice")}</p>}
      </div>

      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-2xs font-medium uppercase tracking-wide2">
            {t("color")}: <span className="font-normal normal-case tracking-normal text-ink-soft">{colorObj?.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  onColorChange(c.slug);
                  setError(null);
                }}
                aria-pressed={color === c.slug}
                aria-label={c.name}
                title={c.name}
                className={clsx(
                  "h-8 w-8 rounded-full border transition-shadow",
                  color === c.slug ? "border-obsidian shadow-[0_0_0_2px_white,0_0_0_3px_#111]" : "border-line hover:border-ink-faint",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-2xs font-medium uppercase tracking-wide2">{t("size")}</legend>
          <SizeGuideDialog chart={product.sizeChart} />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2" role="radiogroup" aria-label={t("selectSize")}>
          {sizes.map((s) => {
            const stock = stockFor(s);
            const sold = stock <= 0;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                aria-label={sold ? t("sizeOutOfStock", { size: label(s) }) : label(s)}
                disabled={sold}
                onClick={() => {
                  setSize(s);
                  setError(null);
                }}
                className={clsx(
                  "h-11 border px-2 text-sm transition-colors",
                  size === s ? "border-obsidian bg-obsidian text-ivory" : "border-line hover:border-obsidian",
                  sold && "cursor-not-allowed border-line text-ink-faint/60 line-through hover:border-line",
                )}
              >
                {label(s)}
              </button>
            );
          })}
        </div>
        <p className="mt-3 min-h-5 text-xs text-ink-soft" aria-live="polite">
          {variant
            ? variant.stock <= 0
              ? t("outOfStock")
              : variant.stock <= LOW_STOCK_THRESHOLD
                ? t("lowStock", { count: variant.stock })
                : t("inStock")
            : product.inStock
              ? ""
              : t("outOfStock")}
        </p>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex h-12 items-center border border-line" role="group" aria-label={t("quantity")}>
            <button
              type="button"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
              aria-label={t("decrease")}
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <MinusIcon size={16} />
            </button>
            <output className="w-8 text-center text-sm" aria-live="polite">{qty}</output>
            <button
              type="button"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
              aria-label={t("increase")}
              disabled={!variant || qty >= maxQty}
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            >
              <PlusIcon size={16} />
            </button>
          </div>
          <button
            type="button"
            className="btn-dark flex-1"
            disabled={!product.inStock}
            onClick={() => {
              if (add()) {
                toast(tc("product.added"));
                setCartOpen(true);
                onAdded?.();
              }
            }}
          >
            {product.inStock ? t("addToCart") : t("outOfStock")}
          </button>
        </div>
        <button
          type="button"
          className="btn-outline w-full"
          disabled={!product.inStock}
          onClick={() => {
            if (add()) {
              onAdded?.();
              router.push("/checkout");
            }
          }}
        >
          {t("buyNow")}
        </button>
        {variant && maxQty < variant.stock && maxQty > 0 && (
          <p className="text-xs text-ink-soft">{t("maxQuantity", { count: variant.stock })}</p>
        )}
        <p role="alert" className="min-h-5 text-xs text-[#9B1C1C]">{error}</p>
        <WishlistButton productId={product.id} withLabel className="self-start py-1" />
      </div>
    </div>
  );
}
