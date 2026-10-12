"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useStore } from "@/components/providers/StoreProvider";
import { HeartIcon } from "@/components/ui/Icons";

export function WishlistButton({
  productId,
  className,
  size = 18,
  withLabel = false,
}: {
  productId: string;
  className?: string;
  size?: number;
  withLabel?: boolean;
}) {
  const t = useTranslations("common.product");
  const { isWished, toggleWish, toast } = useStore();
  const wished = isWished(productId);
  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={wished ? t("removeFromWishlist") : t("addToWishlist")}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const saved = await toggleWish(productId);
        toast(saved ? t("wishlistAdded") : t("wishlistRemoved"));
      }}
      className={clsx("inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-70", className)}
    >
      <HeartIcon size={size} filled={wished} />
      {withLabel && (
        <span className="text-2xs font-medium uppercase tracking-wide2">
          {wished ? t("removeFromWishlist") : t("addToWishlist")}
        </span>
      )}
    </button>
  );
}
