"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

export function WishlistClient() {
  const t = useTranslations("account.wishlist");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const { wishlist, signedIn } = useStore();
  const [items, setItems] = useState<Card[] | null>(null);
  const key = [...wishlist].sort().join(",");

  useEffect(() => {
    if (!key) return setItems([]);
    fetch(`/api/products?locale=${locale}&ids=${key}`).then((r) => r.json()).then((d: { items: Card[] }) => setItems(d.items)).catch(() => setItems([]));
  }, [key, locale]);

  const visible = (items ?? []).filter((p) => wishlist.includes(p.id));
  return (
    <div>
      <p className="mb-8 text-sm text-ink-soft">{t("count", { count: wishlist.length })}{!signedIn && <> — {t("guestNote")} <Link href="/login?next=/wishlist" className="underline">→</Link></>}</p>
      {items === null ? (
        <p className="text-sm text-ink-soft">…</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center border border-dashed border-line py-20 text-center">
          <p className="font-serif text-3xl">{t("empty")}</p>
          <p className="mt-3 text-sm text-ink-soft">{t("emptyText")}</p>
          <Link href="/catalog" className="btn-dark mt-8">{tc("startShopping")}</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
          {visible.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
        </ul>
      )}
    </div>
  );
}
