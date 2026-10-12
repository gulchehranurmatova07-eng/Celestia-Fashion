"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ProductDetail } from "@/lib/catalog";
import { Gallery } from "./Gallery";
import { PurchasePanel } from "./PurchasePanel";

/** Holds the selected colour so the gallery and purchase panel stay in sync. */
export function ProductView({ product, initialColor, children }: { product: ProductDetail; initialColor?: string; children?: ReactNode }) {
  const valid = product.colors.some((c) => c.slug === initialColor);
  const [color, setColor] = useState<string | null>(valid ? initialColor! : product.colors[0]?.slug ?? null);

  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.color === color);
    return forColor.length ? forColor : product.images;
  }, [product.images, color]);

  const changeColor = (slug: string) => {
    setColor(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("color", slug);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
      <Gallery images={images} name={product.name} />
      <div className="px-4 md:px-0">
        <div className="md:sticky md:top-[calc(var(--header-h)+2rem)]">
          <PurchasePanel product={product} color={color} onColorChange={changeColor} />
          {children}
        </div>
      </div>
    </div>
  );
}
