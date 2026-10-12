import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { LOCALES } from "@/lib/constants";
import { localizedUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.collection.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  const paths = [
    "/", "/catalog", "/collections", "/about", "/shipping-returns", "/size-guide", "/contact", "/privacy", "/terms",
    ...categories.map((c) => `/catalog?category=${c.slug}`),
    ...collections.map((c) => `/collections/${c.slug}`),
  ];
  const entry = (path: string, lastModified?: Date) => ({
    url: localizedUrl(path, "en"),
    lastModified,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, localizedUrl(path, l)])) },
  });
  return [...paths.map((p) => entry(p)), ...products.map((p) => entry(`/product/${p.slug}`, p.updatedAt))];
}
