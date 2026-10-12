import clsx from "clsx";
import { formatPrice } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  locale,
  className,
  labels,
}: {
  price: number;
  compareAtPrice?: number | null;
  locale: string;
  className?: string;
  labels?: { original: string; current: string };
}) {
  const onSale = compareAtPrice != null && compareAtPrice > price;
  return (
    <span className={clsx("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      {onSale && (
        <s className="text-ink-faint">
          {labels && <span className="sr-only">{labels.original}: </span>}
          {formatPrice(compareAtPrice!, locale)}
        </s>
      )}
      <span className={clsx(onSale && "text-[#8E1B22]")}>
        {labels && onSale && <span className="sr-only">{labels.current}: </span>}
        {formatPrice(price, locale)}
      </span>
    </span>
  );
}
