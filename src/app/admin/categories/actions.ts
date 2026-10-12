"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { LOCALES } from "@/lib/constants";
import { ActionError, handle, idSchema, imageUrlSchema, intSchema, ok, refresh, slugSchema, str } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

const P = "/admin/categories";

const schema = z.object({
  id: z.string().trim().max(64).optional(),
  slug: slugSchema,
  parentId: z.string().trim().max(64),
  sortOrder: intSchema(-10000, 10000),
  image: imageUrlSchema,
  name_en: z.string().trim().min(1, "English name is required").max(120),
  name_ru: z.string().trim().max(120),
  name_uz: z.string().trim().max(120),
});

export async function saveCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const d = schema.parse({
      id: str(fd, "id") || undefined,
      slug: str(fd, "slug").toLowerCase(),
      parentId: str(fd, "parentId"),
      sortOrder: str(fd, "sortOrder") || "0",
      image: str(fd, "image"),
      name_en: str(fd, "name_en"),
      name_ru: str(fd, "name_ru"),
      name_uz: str(fd, "name_uz"),
    });

    const slugOwner = await db.category.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (slugOwner && slugOwner.id !== d.id) throw new ActionError("This slug is already used.", { slug: "Already in use" });

    const parentId = d.parentId || null;
    if (parentId) {
      const all = await db.category.findMany({ select: { id: true, parentId: true } });
      if (!all.some((c) => c.id === parentId)) throw new ActionError("Parent category not found.", { parentId: "Invalid parent" });
      if (d.id) {
        // Prevent cycles: the new parent may not be this category or one of its descendants.
        let cur: string | null = parentId;
        const byId = new Map(all.map((c) => [c.id, c.parentId]));
        for (let guard = 0; cur && guard < 100; guard++) {
          if (cur === d.id) throw new ActionError("A category cannot be placed inside itself or its own subcategory.", { parentId: "Invalid parent" });
          cur = byId.get(cur) ?? null;
        }
      }
    }

    const base = { slug: d.slug, parentId, sortOrder: d.sortOrder, image: d.image || null };
    const id = await db.$transaction(async (tx) => {
      const cat = d.id ? await tx.category.update({ where: { id: d.id }, data: base }) : await tx.category.create({ data: base });
      for (const l of LOCALES) {
        const name = d[`name_${l}`] || d.name_en; // categories need a name in every locale; fall back to English
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: cat.id, locale: l } },
          update: { name },
          create: { categoryId: cat.id, locale: l, name },
        });
      }
      return cat.id;
    });

    refresh(P, `${P}/${id}`, "/admin/products");
    return ok(d.id ? "Category saved." : "Category created.");
  });
}

export async function deleteCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let done = false;
  const result = await handle(async () => {
    await requireAdmin();
    const id = idSchema.parse(str(fd, "id"));
    const cat = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } });
    if (!cat) throw new ActionError("Category not found.");
    if (cat._count.children > 0) throw new ActionError(`Cannot delete: “${cat.slug}” has ${cat._count.children} subcategor${cat._count.children === 1 ? "y" : "ies"}. Move or delete them first.`);
    if (cat._count.products > 0) throw new ActionError(`Cannot delete: ${cat._count.products} product(s) use “${cat.slug}”. Reassign them first (archived products count too).`);
    await db.category.delete({ where: { id } });
    refresh(P, "/admin/products");
    done = str(fd, "redirect") === "1";
    return ok("Category deleted.");
  });
  if (done) redirect(`${P}?deleted=1`);
  return result;
}
