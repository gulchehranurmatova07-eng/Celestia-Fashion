import "server-only";
import { db } from "./db";
import { colorName, pickTranslation } from "./catalog";

/** Current, server-authoritative details for the given variant ids. */
export async function cartDetails(variantIds: string[], locale: string) {
  if (!variantIds.length) return [];
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      color: true,
      product: {
        include: {
          translations: true,
          images: { orderBy: { sortOrder: "asc" }, select: { url: true, colorId: true } },
        },
      },
    },
  });
  return variants.map((v) => {
    const p = v.product;
    const image = p.images.find((i) => i.colorId === v.colorId) ?? p.images[0];
    return {
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: pickTranslation(p.translations, locale)?.name ?? p.slug,
      colorName: colorName(v.color, locale),
      size: v.size,
      sku: v.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      image: image?.url ?? null,
      stock: v.stock,
      available: p.status === "ACTIVE",
    };
  });
}
