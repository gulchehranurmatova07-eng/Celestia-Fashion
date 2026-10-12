"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCarousel } from "@/components/product/ProductCarousel";

const KEY = "celestia_recent_v1";

/** Records the current product and shows the others recently viewed on this device. */
export function RecentlyViewed({ productId, title, labels }: { productId: string; title: string; labels: { prev: string; next: string } }) {
  const locale = useLocale();
  const [items, setItems] = useState<Card[]>([]);

  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {}
    const others = ids.filter((id) => id !== productId).slice(0, 12);
    try {
      localStorage.setItem(KEY, JSON.stringify([productId, ...others].slice(0, 16)));
    } catch {}
    if (!others.length) return;
    fetch(`/api/products?locale=${locale}&ids=${others.join(",")}`)
      .then((r) => r.json())
      .then((d: { items: Card[] }) => setItems(d.items))
      .catch(() => {});
  }, [productId, locale]);

  if (!items.length) return null;
  return (
    <section className="container-luxe border-t border-line py-16 md:py-24">
      <h2 className="heading-display mb-2 text-4xl md:text-5xl">{title}</h2>
      <ProductCarousel products={items} labels={{ ...labels, region: title }} />
    </section>
  );
}
