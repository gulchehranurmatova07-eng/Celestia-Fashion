import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, priorityCount = 0, columns = 4 }: { products: Card[]; priorityCount?: number; columns?: 3 | 4 }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 ${columns === 4 ? "xl:grid-cols-4" : ""}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard
            product={p}
            priority={i < priorityCount}
            sizes={columns === 4 ? "(min-width: 1280px) 23vw, (min-width: 768px) 31vw, 48vw" : "(min-width: 768px) 25vw, 48vw"}
          />
        </li>
      ))}
    </ul>
  );
}
