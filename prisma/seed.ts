import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BRANDS, CATEGORIES, COLLECTIONS, COLORS, PRODUCTS, CARE_TEXT, DISCOUNT_CODES } from "./seed-data";

const db = new PrismaClient();
const LOCALES = ["en", "ru", "uz"] as const;

// Deterministic stock levels so demo data is reproducible (some sizes sold out on purpose).
function stockFor(sku: string) {
  let h = 0;
  for (const ch of sku) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = h % 10;
  return r < 1 ? 0 : r < 3 ? 2 : 4 + (h % 9);
}

async function main() {
  console.log("Seeding CELESTIA demo catalogue…");

  for (const c of COLORS) await db.color.upsert({ where: { slug: c.slug }, update: c, create: c });
  for (const b of BRANDS) await db.brand.upsert({ where: { slug: b.slug }, update: b, create: b });

  for (const [i, c] of CATEGORIES.entries()) {
    const parent = c.parent ? await db.category.findUniqueOrThrow({ where: { slug: c.parent } }) : null;
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      update: { parentId: parent?.id ?? null, image: c.image ?? null, sortOrder: i },
      create: { slug: c.slug, parentId: parent?.id ?? null, image: c.image ?? null, sortOrder: i },
    });
    for (const l of LOCALES) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: cat.id, locale: l } },
        update: { name: c.name[l] },
        create: { categoryId: cat.id, locale: l, name: c.name[l] },
      });
    }
  }

  for (const [i, c] of COLLECTIONS.entries()) {
    const col = await db.collection.upsert({
      where: { slug: c.slug },
      update: { image: c.image, sortOrder: i },
      create: { slug: c.slug, image: c.image, sortOrder: i },
    });
    for (const l of LOCALES) {
      await db.collectionTranslation.upsert({
        where: { collectionId_locale: { collectionId: col.id, locale: l } },
        update: { name: c.name[l], description: c.description[l] },
        create: { collectionId: col.id, locale: l, name: c.name[l], description: c.description[l] },
      });
    }
  }

  const colors = Object.fromEntries((await db.color.findMany()).map((c) => [c.slug, c.id]));
  const brands = Object.fromEntries((await db.brand.findMany()).map((b) => [b.slug, b.id]));
  const categories = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  const base = Date.now();
  for (const [i, p] of PRODUCTS.entries()) {
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) await db.product.delete({ where: { id: existing.id } });
    await db.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        status: "ACTIVE",
        gender: p.gender,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        isNew: Boolean(p.isNew),
        trending: Boolean(p.trending),
        isDemo: true,
        sortWeight: p.weight,
        sizeChart: p.sizeChart,
        categoryId: categories[p.category],
        brandId: brands[p.brand],
        // newer products first in "Newest" sorting
        createdAt: new Date(base - (p.isNew ? 0 : 30) * 86400000 - i * 3600000),
        collections: { connect: p.collections.map((slug) => ({ slug })) },
        translations: {
          create: LOCALES.map((l) => ({
            locale: l,
            name: p.name[l],
            description: p.description[l],
            materials: p.materials[l],
            care: CARE_TEXT[p.care][l],
          })),
        },
        images: {
          create: p.variants.flatMap((v, vi) =>
            v.images.map((url, ii) => ({ url, alt: `${p.name.en} — ${v.color}`, colorId: colors[v.color], sortOrder: vi * 10 + ii })),
          ),
        },
        variants: {
          create: p.variants.flatMap((v, vi) =>
            p.sizes.map((size, si) => {
              const sku = `${p.sku}-${v.color.toUpperCase().slice(0, 3)}-${size}`;
              return { colorId: colors[v.color], size, sku, stock: stockFor(sku), sortOrder: vi * 100 + si };
            }),
          ),
        },
      },
    });
  }

  for (const d of DISCOUNT_CODES) await db.discountCode.upsert({ where: { code: d.code }, update: {}, create: d });

  const email = (process.env.ADMIN_EMAIL || "admin@celestia.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    await db.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, name: "CELESTIA Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Administrator: ${email}`);
  } else {
    console.warn("ADMIN_PASSWORD not set — no administrator account created.");
  }

  console.log(`Seeded ${PRODUCTS.length} demo products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
