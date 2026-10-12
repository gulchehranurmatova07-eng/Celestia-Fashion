"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteImage, saveImage } from "@/lib/storage";
import { GENDERS, LOCALES, PRODUCT_STATUSES, SIZE_CHARTS } from "@/lib/constants";
import { ActionError, bool, handle, idSchema, intSchema, ok, refresh, slugSchema, str, strs } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/products";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const skuSchema = z
  .string()
  .trim()
  .min(1, "SKU is required")
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use letters, numbers, dots, dashes or underscores");

const variantSchema = z.object({
  colorId: idSchema,
  size: z.string().trim().min(1, "Size is required").max(16),
  sku: skuSchema,
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").max(1_000_000),
});

const translationSchema = (required: boolean) =>
  z.object({
    name: required ? z.string().trim().min(1, "English name is required").max(200) : z.string().trim().max(200),
    description: z.string().trim().max(10000),
    materials: z.string().trim().max(2000),
    care: z.string().trim().max(2000),
  });

const productSchema = z
  .object({
    id: z.string().trim().max(64).optional(),
    slug: slugSchema,
    sku: skuSchema,
    status: z.enum(PRODUCT_STATUSES),
    gender: z.enum(GENDERS),
    categoryId: idSchema,
    brandId: z.string().trim().max(64),
    newBrandName: z.string().trim().max(80),
    price: intSchema(1).refine((n) => n > 0, "Price must be greater than 0"),
    compareAtPrice: z.union([z.literal(""), intSchema(1)]),
    isNew: z.boolean(),
    trending: z.boolean(),
    isDemo: z.boolean(),
    sortWeight: intSchema(-100000, 100000),
    sizeChart: z.enum(SIZE_CHARTS),
    collectionIds: z.array(idSchema).max(200),
    translations: z.object({ en: translationSchema(true), ru: translationSchema(false), uz: translationSchema(false) }),
    variants: z.array(variantSchema).max(500),
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice !== "" && v.compareAtPrice <= v.price) {
      ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price must be higher than the price (or left empty)" });
    }
    if (!v.brandId && !v.newBrandName) {
      ctx.addIssue({ code: "custom", path: ["brandId"], message: "Choose a brand or enter a new brand name" });
    }
    const keys = new Set<string>();
    const skus = new Set<string>();
    v.variants.forEach((variant, i) => {
      const key = `${variant.colorId}|${variant.size.toUpperCase()}`;
      if (keys.has(key)) ctx.addIssue({ code: "custom", path: ["variants", i], message: `Duplicate variant ${variant.size}` });
      keys.add(key);
      const sku = variant.sku.toUpperCase();
      if (skus.has(sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: `Duplicate variant SKU ${variant.sku}` });
      skus.add(sku);
    });
  });

function parseVariants(raw: string): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    throw new ActionError("Variant data could not be read. Reload the page and try again.");
  }
}

export async function saveProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  const result = await handle(async () => {
    await requireAdmin();
    const data = productSchema.parse({
      id: str(fd, "id") || undefined,
      slug: str(fd, "slug").toLowerCase(),
      sku: str(fd, "sku"),
      status: str(fd, "status"),
      gender: str(fd, "gender"),
      categoryId: str(fd, "categoryId"),
      brandId: str(fd, "brandId"),
      newBrandName: str(fd, "newBrandName"),
      price: str(fd, "price"),
      compareAtPrice: str(fd, "compareAtPrice"),
      isNew: bool(fd, "isNew"),
      trending: bool(fd, "trending"),
      isDemo: bool(fd, "isDemo"),
      sortWeight: str(fd, "sortWeight") || "0",
      sizeChart: str(fd, "sizeChart"),
      collectionIds: strs(fd, "collectionIds"),
      translations: Object.fromEntries(
        LOCALES.map((l) => [
          l,
          {
            name: str(fd, `name_${l}`),
            description: str(fd, `description_${l}`),
            materials: str(fd, `materials_${l}`),
            care: str(fd, `care_${l}`),
          },
        ]),
      ),
      variants: parseVariants(str(fd, "variants")),
    });

    // Uniqueness checks with friendly messages.
    const [slugOwner, skuOwner] = await Promise.all([
      db.product.findUnique({ where: { slug: data.slug }, select: { id: true } }),
      db.product.findUnique({ where: { sku: data.sku }, select: { id: true } }),
    ]);
    if (slugOwner && slugOwner.id !== data.id) throw new ActionError("This slug is already used by another product.", { slug: "Already in use" });
    if (skuOwner && skuOwner.id !== data.id) throw new ActionError("This SKU is already used by another product.", { sku: "Already in use" });

    const variantSkus = data.variants.map((v) => v.sku);
    if (variantSkus.length) {
      const clash = await db.productVariant.findFirst({
        where: { sku: { in: variantSkus }, ...(data.id ? { productId: { not: data.id } } : {}) },
        select: { sku: true },
      });
      if (clash) throw new ActionError(`Variant SKU ${clash.sku} is already used by another product.`);
    }

    const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) throw new ActionError("Choose a valid category.", { categoryId: "Invalid category" });

    const colorIds = [...new Set(data.variants.map((v) => v.colorId))];
    if (colorIds.length) {
      const found = await db.color.count({ where: { id: { in: colorIds } } });
      if (found !== colorIds.length) throw new ActionError("One of the selected colours no longer exists.");
    }
    const collections = data.collectionIds.length
      ? await db.collection.findMany({ where: { id: { in: data.collectionIds } }, select: { id: true } })
      : [];

    let brandId = data.brandId;
    if (data.newBrandName) {
      const slug = slugify(data.newBrandName) || `brand-${Date.now()}`;
      const brand = await db.brand.upsert({ where: { slug }, update: {}, create: { slug, name: data.newBrandName } });
      brandId = brand.id;
    } else if (!(await db.brand.findUnique({ where: { id: brandId }, select: { id: true } }))) {
      throw new ActionError("Choose a valid brand.", { brandId: "Invalid brand" });
    }

    const base = {
      slug: data.slug,
      sku: data.sku,
      status: data.status,
      gender: data.gender,
      price: data.price,
      compareAtPrice: data.compareAtPrice === "" ? null : data.compareAtPrice,
      isNew: data.isNew,
      trending: data.trending,
      isDemo: data.isDemo,
      sortWeight: data.sortWeight,
      sizeChart: data.sizeChart,
      categoryId: data.categoryId,
      brandId,
    };

    const productId = await db.$transaction(async (tx) => {
      let id = data.id;
      if (id) {
        const exists = await tx.product.findUnique({ where: { id }, select: { id: true } });
        if (!exists) throw new ActionError("This product no longer exists.");
        await tx.product.update({ where: { id }, data: { ...base, collections: { set: collections.map((c) => ({ id: c.id })) } } });
      } else {
        const created = await tx.product.create({ data: { ...base, collections: { connect: collections.map((c) => ({ id: c.id })) } } });
        id = created.id;
      }

      for (const l of LOCALES) {
        const t = data.translations[l];
        if (l !== "en" && !t.name) {
          // No name → no translation row; the storefront falls back to English.
          await tx.productTranslation.deleteMany({ where: { productId: id, locale: l } });
          continue;
        }
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: l } },
          update: t,
          create: { ...t, productId: id, locale: l },
        });
      }

      // Variants: sync by (colorId, size). Removing a variant keeps order history (OrderItem.variantId → NULL).
      const existing = await tx.productVariant.findMany({ where: { productId: id } });
      const keyOf = (v: { colorId: string; size: string }) => `${v.colorId}|${v.size.toUpperCase()}`;
      const incoming = new Map(data.variants.map((v, i) => [keyOf(v), { ...v, sortOrder: i }]));
      const toDelete = existing.filter((v) => !incoming.has(keyOf(v)));
      if (toDelete.length) await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
      // Temporarily free SKUs of kept variants so SKUs can be swapped between variants.
      const kept = existing.filter((v) => incoming.has(keyOf(v)));
      for (const v of kept) await tx.productVariant.update({ where: { id: v.id }, data: { sku: `__tmp__${v.id}` } });
      for (const v of kept) {
        const next = incoming.get(keyOf(v))!;
        await tx.productVariant.update({
          where: { id: v.id },
          data: { sku: next.sku, stock: next.stock, sortOrder: next.sortOrder, size: next.size },
        });
        incoming.delete(keyOf(v));
      }
      for (const v of incoming.values()) {
        await tx.productVariant.create({
          data: { productId: id, colorId: v.colorId, size: v.size, sku: v.sku, stock: v.stock, sortOrder: v.sortOrder },
        });
      }
      return id;
    });

    refresh(P, `${P}/${productId}`);
    if (!data.id) {
      createdId = productId;
      return ok("Product created.");
    }
    return ok("Product saved.");
  });
  if (createdId) redirect(`${P}/${createdId}?created=1`);
  return result;
}

export async function setProductStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const { id, status } = z.object({ id: idSchema, status: z.enum(PRODUCT_STATUSES) }).parse({
      id: str(fd, "id"),
      status: str(fd, "status"),
    });
    await db.product.update({ where: { id }, data: { status } });
    refresh(P, `${P}/${id}`, "/admin");
    return ok(status === "ARCHIVED" ? "Product archived." : status === "ACTIVE" ? "Product is active." : "Product set to draft.");
  });
}

export async function deleteProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  const result = await handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const product = await db.product.findUnique({ where: { id }, include: { images: { select: { url: true } } } });
    if (!product) throw new ActionError("This product no longer exists.");
    // Order items keep their snapshot (name/SKU/price); productId & variantId become NULL.
    await db.product.delete({ where: { id } });
    await Promise.all(product.images.map((i) => deleteImage(i.url)));
    refresh(P, "/admin");
    if (str(fd, "redirect") === "1") redirectTo = `${P}?deleted=1`;
    return ok("Product deleted.");
  });
  if (redirectTo) redirect(redirectTo);
  return result;
}

export async function archiveDemoProductsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    if (str(fd, "confirm") !== "ARCHIVE") throw new ActionError("Confirmation missing.");
    const res = await db.product.updateMany({ where: { isDemo: true, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED" } });
    refresh(P, "/admin");
    return ok(res.count ? `${res.count} demo product${res.count === 1 ? "" : "s"} archived.` : "No active demo products to archive.");
  });
}

/* ---------------- Colours ---------------- */

export async function createColorAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const data = z
      .object({
        slug: slugSchema,
        hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #1C2541"),
        nameEn: z.string().trim().min(1, "English name is required").max(60),
        nameRu: z.string().trim().max(60),
        nameUz: z.string().trim().max(60),
      })
      .parse({
        slug: str(fd, "colorSlug").toLowerCase(),
        hex: str(fd, "colorHex"),
        nameEn: str(fd, "colorNameEn"),
        nameRu: str(fd, "colorNameRu"),
        nameUz: str(fd, "colorNameUz"),
      });
    if (await db.color.findUnique({ where: { slug: data.slug } })) throw new ActionError("A colour with this slug already exists.");
    const color = await db.color.create({
      data: { ...data, hex: data.hex.toUpperCase(), nameRu: data.nameRu || data.nameEn, nameUz: data.nameUz || data.nameEn },
    });
    refresh(P);
    return ok(`Colour “${color.nameEn}” added.`, { id: color.id });
  });
}

/* ---------------- Images ---------------- */

async function assertColor(colorId: string) {
  if (!colorId) return null;
  const c = await db.color.findUnique({ where: { id: colorId }, select: { id: true } });
  if (!c) throw new ActionError("Unknown colour.");
  return c.id;
}

/** Uploads ONE image (the client calls this once per selected file). */
export async function uploadProductImageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const productId = idSchema.parse(str(fd, "productId"));
    const alt = z.string().trim().max(200).parse(str(fd, "alt"));
    const colorId = await assertColor(str(fd, "colorId"));
    const f = fd.get("file");
    if (!(f instanceof File) || f.size === 0) throw new ActionError("Choose at least one image.");
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new ActionError("This product no longer exists.");
    const url = await saveImage(f);
    const last = await db.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
    await db.productImage.create({ data: { productId, url, alt, colorId, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    refresh(P, `${P}/${productId}`);
    return ok("Image uploaded.", { url });
  });
}

export async function updateProductImageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const alt = z.string().trim().max(200).parse(str(fd, "alt"));
    const colorId = await assertColor(str(fd, "colorId"));
    const img = await db.productImage.update({ where: { id }, data: { alt, colorId } });
    refresh(P, `${P}/${img.productId}`);
    return ok("Image details saved.");
  });
}

export async function moveProductImageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const { id, dir } = z.object({ id: idSchema, dir: z.enum(["up", "down"]) }).parse({ id: str(fd, "id"), dir: str(fd, "dir") });
    const img = await db.productImage.findUnique({ where: { id } });
    if (!img) throw new ActionError("Image not found.");
    const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    const idx = all.findIndex((i) => i.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= all.length) return ok("Already at the " + (dir === "up" ? "top." : "bottom."));
    [all[idx], all[swap]] = [all[swap], all[idx]];
    await db.$transaction(all.map((i, n) => db.productImage.update({ where: { id: i.id }, data: { sortOrder: n } })));
    refresh(P, `${P}/${img.productId}`);
    return ok("Image order updated.");
  });
}

export async function deleteProductImageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const img = await db.productImage.delete({ where: { id } });
    // Only delete the file if no other image row references it.
    const stillUsed = await db.productImage.count({ where: { url: img.url } });
    if (!stillUsed) await deleteImage(img.url);
    refresh(P, `${P}/${img.productId}`);
    return ok("Image deleted.");
  });
}
