import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AuthError, getCurrentUser, requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { paymentStatusReport } from "@/lib/payments";
import { LOW_STOCK_THRESHOLD, ORDER_STATUSES, PRODUCT_STATUSES } from "@/lib/constants";

/*
 * Admin data loaders. Every function calls `requireAdmin()` itself — pages must
 * never rely on the layout alone for authorisation.
 */

export const ADMIN_PAGE_SIZE = 25;

/**
 * Authorisation for every loader: `requireAdmin()` throws for non-admins.
 * Signed-out visitors are sent to the login page instead of producing an error.
 */
async function guard() {
  try {
    return await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError && !(await getCurrentUser())) redirect("/login?next=/admin");
    throw err;
  }
}

type Named = { locale: string; name: string };
export function enName(rows: Named[] | undefined, fallback = "—") {
  if (!rows?.length) return fallback;
  return (rows.find((r) => r.locale === "en") ?? rows[0]).name || fallback;
}

type CatLike = { slug: string; translations: Named[]; parent?: { slug: string; translations: Named[] } | null };
export function categoryLabel(c: CatLike) {
  const own = enName(c.translations, c.slug);
  return c.parent ? `${enName(c.parent.translations, c.parent.slug)} › ${own}` : own;
}

function pageOf(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboard() {
  await guard();
  const [ordersTotal, ordersPending, revenue, activeProducts, demoProducts, lowStockCount, subscribers, recentOrders, lowStock] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.product.count({ where: { isDemo: true } }),
      db.productVariant.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { status: { not: "ARCHIVED" } } } }),
      db.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      db.productVariant.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { status: { not: "ARCHIVED" } } },
        orderBy: [{ stock: "asc" }, { sku: "asc" }],
        take: 15,
        include: {
          color: true,
          product: { select: { id: true, isDemo: true, translations: { select: { locale: true, name: true } } } },
        },
      }),
    ]);
  return {
    ordersTotal,
    ordersPending,
    revenue: revenue._sum.total ?? 0,
    activeProducts,
    demoProducts,
    lowStockCount,
    subscribers,
    recentOrders,
    lowStock,
  };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export async function listProducts(params: { q?: string; status?: string; demo?: string; page?: string }) {
  await guard();
  const q = (params.q ?? "").trim().slice(0, 100);
  const status = PRODUCT_STATUSES.includes(params.status as (typeof PRODUCT_STATUSES)[number]) ? params.status : undefined;
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(params.demo === "1" ? { isDemo: true } : {}),
    ...(q
      ? {
          OR: [
            { sku: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const page = pageOf(params.page);
  const [total, rows, demoCount] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        translations: { select: { locale: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
        variants: { select: { stock: true } },
        category: { include: { translations: true, parent: { include: { translations: true } } } },
        _count: { select: { orderItems: true } },
      },
    }),
    db.product.count({ where: { isDemo: true, status: { not: "ARCHIVED" } } }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), demoCount, q, status: status ?? "" };
}

export async function getProductFormOptions() {
  await guard();
  const [categories, brands, colors, collections] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }],
      include: { translations: true, parent: { include: { translations: true } } },
    }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.color.findMany({ orderBy: { nameEn: "asc" } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
  ]);
  return {
    categories: categories
      .map((c) => ({ id: c.id, label: categoryLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    brands: brands.map((b) => ({ id: b.id, name: b.name })),
    colors: colors.map((c) => ({ id: c.id, slug: c.slug, hex: c.hex, nameEn: c.nameEn })),
    collections: collections.map((c) => ({ id: c.id, label: enName(c.translations, c.slug), active: c.active })),
  };
}

export async function getProductForEdit(id: string) {
  await guard();
  return db.product.findUnique({
    where: { id },
    include: {
      translations: true,
      collections: { select: { id: true } },
      variants: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { orderItems: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      _count: { select: { orderItems: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Categories & collections                                            */
/* ------------------------------------------------------------------ */

export async function listCategoryTree() {
  await guard();
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    include: { translations: true, _count: { select: { products: true, children: true } } },
  });
  const roots = all.filter((c) => !c.parentId);
  const childrenOf = (id: string) => all.filter((c) => c.parentId === id);
  const tree: { node: (typeof all)[number]; depth: number }[] = [];
  const walk = (nodes: typeof all, depth: number, seen: Set<string>) => {
    for (const n of nodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      tree.push({ node: n, depth });
      walk(childrenOf(n.id), depth + 1, seen);
    }
  };
  const seen = new Set<string>();
  walk(roots, 0, seen);
  // Orphans (should not happen) are listed at the end.
  for (const n of all) if (!seen.has(n.id)) tree.push({ node: n, depth: 0 });
  return { tree, all };
}

export async function getCategory(id: string) {
  await guard();
  return db.category.findUnique({
    where: { id },
    include: { translations: true, _count: { select: { products: true, children: true } } },
  });
}

export async function listCollections() {
  await guard();
  return db.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    include: { translations: true, _count: { select: { products: true } } },
  });
}

export async function getCollection(id: string) {
  await guard();
  return db.collection.findUnique({
    where: { id },
    include: { translations: true, products: { select: { id: true } } },
  });
}

export async function listProductsForAssignment() {
  await guard();
  const rows = await db.product.findMany({
    orderBy: [{ status: "asc" }, { sku: "asc" }],
    select: { id: true, sku: true, status: true, isDemo: true, translations: { select: { locale: true, name: true } } },
  });
  return rows.map((p) => ({ id: p.id, sku: p.sku, status: p.status, isDemo: p.isDemo, name: enName(p.translations, p.sku) }));
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export async function listOrders(params: { q?: string; status?: string; page?: string }) {
  await guard();
  const q = (params.q ?? "").trim().slice(0, 100);
  const status = ORDER_STATUSES.includes(params.status as (typeof ORDER_STATUSES)[number]) ? params.status : undefined;
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const page = pageOf(params.page);
  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), q, status: status ?? "" };
}

export async function getOrder(id: string) {
  await guard();
  return db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Discounts                                                           */
/* ------------------------------------------------------------------ */

export async function listDiscounts() {
  await guard();
  return db.discountCode.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
}

export async function getDiscount(id: string) {
  await guard();
  return db.discountCode.findUnique({ where: { id } });
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export async function listCustomers(params: { q?: string; admins?: string; page?: string }) {
  await guard();
  const q = (params.q ?? "").trim().slice(0, 100);
  const where: Prisma.UserWhereInput = {
    ...(params.admins === "1" ? {} : { role: "CUSTOMER" }),
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const page = pageOf(params.page);
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: safeUserSelect,
    }),
  ]);
  const spent = rows.length
    ? await db.order.groupBy({
        by: ["userId"],
        where: { userId: { in: rows.map((r) => r.id) }, status: { not: "CANCELLED" } },
        _sum: { total: true },
      })
    : [];
  const spentBy = new Map(spent.map((s) => [s.userId, s._sum.total ?? 0]));
  return {
    rows: rows.map((r) => ({ ...r, spent: spentBy.get(r.id) ?? 0 })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    q,
  };
}

export async function getCustomer(id: string) {
  await guard();
  const user = await db.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) return null;
  const orders = await db.order.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  const spent = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);
  return { user, orders, spent };
}

/* ------------------------------------------------------------------ */
/* Newsletter, settings, outbox                                        */
/* ------------------------------------------------------------------ */

export async function listSubscribers(params: { status?: string; q?: string; page?: string }) {
  await guard();
  const status = params.status === "SUBSCRIBED" || params.status === "UNSUBSCRIBED" ? params.status : undefined;
  const q = (params.q ?? "").trim().slice(0, 100);
  const where: Prisma.NewsletterSubscriberWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { email: { contains: q.toLowerCase(), mode: "insensitive" } } : {}),
  };
  const page = pageOf(params.page);
  const [total, rows] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE * 2,
      take: ADMIN_PAGE_SIZE * 2,
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / (ADMIN_PAGE_SIZE * 2))), status: status ?? "", q };
}

export async function exportSubscribers(status?: string) {
  await requireAdmin(); // throws AuthError → the route answers 403 (no redirect)
  const s = status === "SUBSCRIBED" || status === "UNSUBSCRIBED" ? status : undefined;
  return db.newsletterSubscriber.findMany({ where: s ? { status: s } : {}, orderBy: { createdAt: "asc" } });
}

export async function getAdminSettings() {
  await guard();
  const [settings, report] = await Promise.all([getSettings(), Promise.resolve(paymentStatusReport())]);
  return { settings, report };
}

export async function listOutbox(params: { page?: string }) {
  await guard();
  const page = pageOf(params.page);
  const [total, rows, undelivered] = await Promise.all([
    db.emailOutbox.count(),
    db.emailOutbox.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
    db.emailOutbox.count({ where: { delivered: false } }),
  ]);
  return {
    rows,
    total,
    undelivered,
    page,
    pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    smtpConfigured: Boolean(process.env.SMTP_HOST),
  };
}
