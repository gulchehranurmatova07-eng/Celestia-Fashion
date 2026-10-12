import "server-only";
import { cache } from "react";
import { db } from "./db";
import { PAGE_SIZE, sortSizes, type Locale } from "./constants";

/* ------------------------------------------------------------------------ */
/* Localisation helpers                                                      */
/* ------------------------------------------------------------------------ */

type Translated = { locale: string };

export function pickTranslation<T extends Translated>(rows: T[], locale: string): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en") ?? rows[0];
}

export function colorName(c: { nameEn: string; nameRu: string; nameUz: string }, locale: string) {
  return locale === "ru" ? c.nameRu : locale === "uz" ? c.nameUz : c.nameEn;
}

/* ------------------------------------------------------------------------ */
/* Catalogue snapshot                                                        */
/* ------------------------------------------------------------------------ */

const productInclude = {
  translations: true,
  brand: true,
  category: { include: { translations: true, parent: { include: { translations: true } } } },
  collections: { select: { slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, include: { color: { select: { slug: true } } } },
  variants: { orderBy: { sortOrder: "asc" as const }, include: { color: true } },
};

/** Every active product with relations. Cached for the duration of a request. */
const loadActiveProducts = cache(async () =>
  db.product.findMany({ where: { status: "ACTIVE" }, include: productInclude }),
);

type RawProduct = Awaited<ReturnType<typeof loadActiveProducts>>[number];

export type ProductColor = { slug: string; hex: string; name: string };
export type CardVariant = { id: string; color: string; size: string; stock: number };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  isDemo: boolean;
  images: { url: string; alt: string; color: string | null }[];
  colors: ProductColor[];
  sizes: string[];
  variants: CardVariant[];
  inStock: boolean;
};

function colorsOf(p: RawProduct, locale: string): ProductColor[] {
  const seen = new Map<string, ProductColor>();
  for (const v of p.variants) {
    if (!seen.has(v.color.slug)) seen.set(v.color.slug, { slug: v.color.slug, hex: v.color.hex, name: colorName(v.color, locale) });
  }
  return [...seen.values()];
}

export function toCard(p: RawProduct, locale: string): ProductCard {
  const t = pickTranslation(p.translations, locale);
  const cat = pickTranslation(p.category.translations, locale);
  return {
    id: p.id,
    slug: p.slug,
    name: t?.name ?? p.slug,
    brand: p.brand.name,
    categoryName: cat?.name ?? p.category.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    isNew: p.isNew,
    isDemo: p.isDemo,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt || t?.name || "", color: i.color?.slug ?? null })),
    colors: colorsOf(p, locale),
    sizes: sortSizes([...new Set(p.variants.map((v) => v.size))]),
    variants: p.variants.map((v) => ({ id: v.id, color: v.color.slug, size: v.size, stock: v.stock })),
    inStock: p.variants.some((v) => v.stock > 0),
  };
}

/* ------------------------------------------------------------------------ */
/* Filtering                                                                 */
/* ------------------------------------------------------------------------ */

import { SORTS, type Sort } from "./catalog-shared";
export { SORTS, type Sort };

export type CatalogFilters = {
  gender?: "men" | "women" | "unisex";
  category?: string;
  collection?: string;
  brands: string[];
  sizes: string[];
  colors: string[];
  min?: number;
  max?: number;
  available: boolean;
  sale: boolean;
  isNew: boolean;
  q: string;
  sort: Sort;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined) {
  if (!v) return [];
  return (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);
}
function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
function num(v: string | string[] | undefined) {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

export function parseFilters(params: Params): CatalogFilters {
  const gender = one(params.gender);
  const sort = one(params.sort) as Sort;
  return {
    gender: gender === "men" || gender === "women" || gender === "unisex" ? gender : undefined,
    category: one(params.category) || undefined,
    collection: one(params.collection) || undefined,
    brands: list(params.brand),
    sizes: list(params.size),
    colors: list(params.color),
    min: num(params.min),
    max: num(params.max),
    available: one(params.available) === "1",
    sale: one(params.sale) === "1",
    isNew: one(params.new) === "1",
    q: (one(params.q) ?? "").trim().slice(0, 100),
    sort: SORTS.includes(sort) ? sort : "recommended",
    page: Math.max(1, num(params.page) ?? 1),
  };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʻʼ‘’`']/g, "");
}

function searchText(p: RawProduct) {
  return normalize(
    [
      ...p.translations.flatMap((t) => [t.name, t.materials]),
      ...p.category.translations.map((t) => t.name),
      ...(p.category.parent?.translations.map((t) => t.name) ?? []),
      p.brand.name,
      p.sku,
      ...p.variants.flatMap((v) => [v.color.nameEn, v.color.nameRu, v.color.nameUz]),
    ].join(" "),
  );
}

function matchesQuery(p: RawProduct, q: string) {
  if (!q) return true;
  const hay = searchText(p);
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

function inCategory(p: RawProduct, slug: string) {
  return p.category.slug === slug || p.category.parent?.slug === slug;
}

function genderMatch(p: RawProduct, g: CatalogFilters["gender"]) {
  if (!g) return true;
  if (g === "unisex") return p.gender === "UNISEX";
  return p.gender === g.toUpperCase() || p.gender === "UNISEX";
}

function scope(products: RawProduct[], f: CatalogFilters) {
  return products.filter(
    (p) =>
      genderMatch(p, f.gender) &&
      (!f.category || inCategory(p, f.category)) &&
      (!f.collection || p.collections.some((c) => c.slug === f.collection)) &&
      matchesQuery(p, f.q),
  );
}

function refine(products: RawProduct[], f: CatalogFilters) {
  return products.filter((p) => {
    if (f.brands.length && !f.brands.includes(p.brand.slug)) return false;
    if (f.isNew && !p.isNew) return false;
    if (f.sale && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    if (f.min && p.price < f.min) return false;
    if (f.max && p.price > f.max) return false;
    const variants = p.variants.filter(
      (v) =>
        (!f.sizes.length || f.sizes.includes(v.size)) &&
        (!f.colors.length || f.colors.includes(v.color.slug)) &&
        (!f.available || v.stock > 0),
    );
    if ((f.sizes.length || f.colors.length || f.available) && variants.length === 0) return false;
    return true;
  });
}

function sortProducts(products: RawProduct[], sort: Sort) {
  const arr = [...products];
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => +b.createdAt - +a.createdAt);
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "popular":
      return arr.sort((a, b) => b.salesCount - a.salesCount || b.sortWeight - a.sortWeight);
    default:
      return arr.sort(
        (a, b) =>
          Number(b.variants.some((v) => v.stock > 0)) - Number(a.variants.some((v) => v.stock > 0)) ||
          b.sortWeight - a.sortWeight ||
          +b.createdAt - +a.createdAt,
      );
  }
}

export type Facets = {
  brands: { slug: string; name: string; count: number }[];
  sizes: string[];
  colors: ProductColor[];
  priceMin: number;
  priceMax: number;
};

function facets(products: RawProduct[], locale: string): Facets {
  const brands = new Map<string, { slug: string; name: string; count: number }>();
  const sizes = new Set<string>();
  const colors = new Map<string, ProductColor>();
  let priceMin = Infinity;
  let priceMax = 0;
  for (const p of products) {
    const b = brands.get(p.brand.slug) ?? { slug: p.brand.slug, name: p.brand.name, count: 0 };
    b.count++;
    brands.set(p.brand.slug, b);
    for (const v of p.variants) {
      sizes.add(v.size);
      if (!colors.has(v.color.slug)) colors.set(v.color.slug, { slug: v.color.slug, hex: v.color.hex, name: colorName(v.color, locale) });
    }
    priceMin = Math.min(priceMin, p.price);
    priceMax = Math.max(priceMax, p.price);
  }
  return {
    brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sizes: sortSizes([...sizes]),
    colors: [...colors.values()],
    priceMin: priceMin === Infinity ? 0 : priceMin,
    priceMax,
  };
}

export async function queryCatalog(f: CatalogFilters, locale: string, pageSize = PAGE_SIZE) {
  const all = await loadActiveProducts();
  const scoped = scope(all, f);
  const refined = sortProducts(refine(scoped, f), f.sort);
  const total = refined.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(f.page, pages);
  // "Load more" semantics: page N shows everything up to N, so results stay in one list.
  const items = refined.slice(0, page * pageSize).map((p) => toCard(p, locale));
  return { items, total, page, pages, facets: facets(scoped, locale) };
}

/* ------------------------------------------------------------------------ */
/* Lists used across the storefront                                          */
/* ------------------------------------------------------------------------ */

export async function newArrivals(locale: string, limit = 8) {
  const all = await loadActiveProducts();
  return sortProducts(all.filter((p) => p.isNew), "recommended").slice(0, limit).map((p) => toCard(p, locale));
}

export async function trendingProducts(locale: string, limit = 12) {
  const all = await loadActiveProducts();
  return sortProducts(all.filter((p) => p.trending), "popular").slice(0, limit).map((p) => toCard(p, locale));
}

export async function cardsByIds(ids: string[], locale: string) {
  const all = await loadActiveProducts();
  const byId = new Map(all.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is RawProduct => Boolean(p)).map((p) => toCard(p, locale));
}

export async function relatedProducts(productId: string, locale: string, limit = 4) {
  const all = await loadActiveProducts();
  const me = all.find((p) => p.id === productId);
  if (!me) return [];
  const sameCollection = new Set(me.collections.map((c) => c.slug));
  const score = (p: RawProduct) =>
    (p.category.id === me.category.id ? 3 : 0) +
    (p.category.parentId && p.category.parentId === me.category.parentId ? 1 : 0) +
    p.collections.filter((c) => sameCollection.has(c.slug)).length * 2;
  return all
    .filter((p) => p.id !== productId)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.sortWeight - a.p.sortWeight)
    .slice(0, limit)
    .map(({ p }) => toCard(p, locale));
}

export async function searchSuggestions(q: string, locale: string, limit = 6) {
  if (q.trim().length < 2) return { products: [], categories: [] };
  const all = await loadActiveProducts();
  const products = all.filter((p) => matchesQuery(p, q)).slice(0, limit).map((p) => toCard(p, locale));
  const nq = normalize(q);
  const cats = await db.category.findMany({ include: { translations: true, _count: { select: { products: true } } } });
  const categories = cats
    .filter((c) => c.translations.some((t) => normalize(t.name).includes(nq)))
    .map((c) => ({ slug: c.slug, name: pickTranslation(c.translations, locale)?.name ?? c.slug }))
    .slice(0, 4);
  return { products, categories };
}

/* ------------------------------------------------------------------------ */
/* Product detail                                                            */
/* ------------------------------------------------------------------------ */

export async function getProductBySlug(slug: string, locale: string) {
  const p = await db.product.findFirst({ where: { slug, status: "ACTIVE" }, include: productInclude });
  if (!p) return null;
  const t = pickTranslation(p.translations, locale);
  const card = toCard(p, locale);
  return {
    ...card,
    sku: p.sku,
    gender: p.gender,
    sizeChart: p.sizeChart,
    description: t?.description ?? "",
    materials: t?.materials ?? "",
    care: t?.care ?? "",
    category: {
      slug: p.category.slug,
      name: pickTranslation(p.category.translations, locale)?.name ?? p.category.slug,
      parent: p.category.parent
        ? { slug: p.category.parent.slug, name: pickTranslation(p.category.parent.translations, locale)?.name ?? p.category.parent.slug }
        : null,
    },
    alternates: Object.fromEntries(p.translations.map((tr) => [tr.locale, tr.name])) as Partial<Record<Locale, string>>,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/* ------------------------------------------------------------------------ */
/* Navigation data                                                           */
/* ------------------------------------------------------------------------ */

export const getCategoryTree = cache(async (locale: string) => {
  const cats = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
  const named = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    parentId: c.parentId,
    image: c.image,
    name: pickTranslation(c.translations, locale)?.name ?? c.slug,
    count: c._count.products,
  }));
  const roots = named
    .filter((c) => !c.parentId)
    .map((r) => {
      const children = named.filter((c) => c.parentId === r.id && c.count > 0);
      return { ...r, count: r.count + children.reduce((s, c) => s + c.count, 0), children };
    });
  return roots.filter((r) => r.count > 0);
});

export const getCollections = cache(async (locale: string) => {
  const cols = await db.collection.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
  return cols.map((c) => {
    const t = pickTranslation(c.translations, locale);
    return { slug: c.slug, image: c.image, name: t?.name ?? c.slug, description: t?.description ?? "", count: c._count.products };
  });
});

export async function getCategoryName(slug: string, locale: string) {
  const c = await db.category.findUnique({ where: { slug }, include: { translations: true } });
  return c ? pickTranslation(c.translations, locale)?.name ?? slug : null;
}
