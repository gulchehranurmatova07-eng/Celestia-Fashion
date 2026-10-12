"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { LOCALES } from "@/lib/constants";
import { ActionError, bool, handle, idSchema, imageUrlSchema, intSchema, ok, refresh, slugSchema, str, strs } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/collections";

const schema = z.object({
  id: z.string().trim().max(64).optional(),
  slug: slugSchema,
  active: z.boolean(),
  sortOrder: intSchema(-10000, 10000),
  image: imageUrlSchema,
  productIds: z.array(idSchema).max(5000),
  name_en: z.string().trim().min(1, "English name is required").max(120),
  name_ru: z.string().trim().max(120),
  name_uz: z.string().trim().max(120),
  description_en: z.string().trim().max(2000),
  description_ru: z.string().trim().max(2000),
  description_uz: z.string().trim().max(2000),
});

export async function saveCollectionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  const result = await handle(async () => {
    await requireAdmin();
    const d = schema.parse({
      id: str(fd, "id") || undefined,
      slug: str(fd, "slug").toLowerCase(),
      active: bool(fd, "active"),
      sortOrder: str(fd, "sortOrder") || "0",
      image: str(fd, "image"),
      productIds: [...new Set(strs(fd, "productIds"))],
      name_en: str(fd, "name_en"),
      name_ru: str(fd, "name_ru"),
      name_uz: str(fd, "name_uz"),
      description_en: str(fd, "description_en"),
      description_ru: str(fd, "description_ru"),
      description_uz: str(fd, "description_uz"),
    });
    const owner = await db.collection.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (owner && owner.id !== d.id) throw new ActionError("This slug is already used.", { slug: "Already in use" });

    const products = d.productIds.length
      ? await db.product.findMany({ where: { id: { in: d.productIds } }, select: { id: true } })
      : [];
    const refs = products.map((p) => ({ id: p.id }));
    const base = { slug: d.slug, active: d.active, sortOrder: d.sortOrder, image: d.image || null };

    const id = await db.$transaction(async (tx) => {
      const col = d.id
        ? await tx.collection.update({ where: { id: d.id }, data: { ...base, products: { set: refs } } })
        : await tx.collection.create({ data: { ...base, products: { connect: refs } } });
      for (const l of LOCALES) {
        const name = d[`name_${l}`] || d.name_en;
        const description = d[`description_${l}`] || (l === "en" ? "" : d.description_en);
        await tx.collectionTranslation.upsert({
          where: { collectionId_locale: { collectionId: col.id, locale: l } },
          update: { name, description },
          create: { collectionId: col.id, locale: l, name, description },
        });
      }
      return col.id;
    });

    refresh(P, `${P}/${id}`, "/admin/products");
    if (!d.id) {
      createdId = id;
      return ok("Collection created.");
    }
    return ok(`Collection saved (${products.length} product${products.length === 1 ? "" : "s"}).`);
  });
  if (createdId) redirect(`${P}/${createdId}?created=1`);
  return result;
}

export async function deleteCollectionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let go = false;
  const result = await handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    // Products are only unlinked (implicit many-to-many), never deleted.
    await db.collection.delete({ where: { id } });
    refresh(P);
    go = str(fd, "redirect") === "1";
    return ok("Collection deleted.");
  });
  if (go) redirect(`${P}?deleted=1`);
  return result;
}

export async function toggleCollectionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const active = bool(fd, "active");
    await db.collection.update({ where: { id }, data: { active } });
    refresh(P, `${P}/${id}`);
    return ok(active ? "Collection activated." : "Collection deactivated.");
  });
}
