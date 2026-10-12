"use client";

import { useRef, useState, useEffect } from "react";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";

export function ProductCarousel({ products, labels }: { products: Card[]; labels: { prev: string; next: string; region: string } }) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useEffect(update, []);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={labels.region}>
      <div className="mb-6 flex justify-end gap-2">
        <button type="button" onClick={() => scroll(-1)} disabled={atStart} aria-label={labels.prev} className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-obsidian disabled:opacity-30">
          <ChevronLeft />
        </button>
        <button type="button" onClick={() => scroll(1)} disabled={atEnd} aria-label={labels.next} className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-obsidian disabled:opacity-30">
          <ChevronRight />
        </button>
      </div>
      <ul ref={ref} onScroll={update} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-5 lg:px-0">
        {products.map((p) => (
          <li key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-[31%] lg:w-[23%]">
            <ProductCard product={p} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 40vw, 68vw" />
          </li>
        ))}
      </ul>
    </div>
  );
}
