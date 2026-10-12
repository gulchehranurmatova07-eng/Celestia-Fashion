import Link from "next/link";
import { notFound } from "next/navigation";
import { enName, getProductFormOptions, getProductForEdit } from "@/lib/admin/queries";
import { LOCALES, type Locale } from "@/lib/constants";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { ProductImages } from "@/components/admin/ProductImages";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Banner, PageHeader, statusTone } from "@/components/admin/ui";
import { btnDanger, btnOutline, section, sectionHead } from "@/components/admin/styles";
import { deleteProductAction, setProductStatusAction } from "../actions";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [product, options] = await Promise.all([getProductForEdit(id), getProductFormOptions()]);
  if (!product) notFound();

  const translations: Partial<Record<Locale, { name: string; description: string; materials: string; care: string }>> = {};
  for (const t of product.translations) {
    if ((LOCALES as readonly string[]).includes(t.locale)) {
      translations[t.locale as Locale] = { name: t.name, description: t.description, materials: t.materials, care: t.care };
    }
  }
  const name = enName(product.translations, product.slug);

  return (
    <>
      <PageHeader
        title={name}
        eyebrow="Edit product"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(product.status)}>{product.status}</Badge>
            {product.isDemo ? <Badge tone="amber">Demo</Badge> : null}
            <span className="font-mono text-xs">{product.sku}</span>
            <span className="text-xs text-ink-faint">· sold {product.salesCount} · in {product._count.orderItems} order line(s)</span>
          </span>
        }
        actions={
          <>
            {product.status === "ACTIVE" ? (
              <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4">
                View in store
              </a>
            ) : null}
            <Link href="/admin/products" className="text-xs underline underline-offset-4">Back to products</Link>
          </>
        }
      />
      {sp.created ? <Banner>Product created. You can now add images below.</Banner> : null}

      <div className="space-y-6">
        <ProductEditor
          options={options}
          product={{
            id: product.id,
            slug: product.slug,
            sku: product.sku,
            status: product.status,
            gender: product.gender,
            categoryId: product.categoryId,
            brandId: product.brandId,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            isNew: product.isNew,
            trending: product.trending,
            isDemo: product.isDemo,
            sortWeight: product.sortWeight,
            sizeChart: product.sizeChart,
            collectionIds: product.collections.map((c) => c.id),
            translations,
            variants: product.variants.map((v) => ({
              id: v.id,
              colorId: v.colorId,
              size: v.size,
              sku: v.sku,
              stock: v.stock,
              orders: v._count.orderItems,
            })),
          }}
        />

        <ProductImages
          productId={product.id}
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, colorId: i.colorId }))}
          colors={options.colors.map((c) => ({ id: c.id, nameEn: c.nameEn }))}
        />

        <section className={section} aria-labelledby="danger-h">
          <div className={sectionHead}>
            <h2 id="danger-h" className="eyebrow">Archive or delete</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <ActionForm action={setProductStatusAction}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="status" value={product.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"} />
              <SubmitButton className={btnOutline}>{product.status === "ARCHIVED" ? "Unarchive (set active)" : "Archive"}</SubmitButton>
            </ActionForm>
            <ActionForm action={deleteProductAction}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="redirect" value="1" />
              <SubmitButton
                className={btnDanger}
                confirm={`Permanently delete “${name}”? ${product._count.orderItems ? "Existing orders keep their item snapshot. " : ""}This cannot be undone.`}
              >
                Delete product
              </SubmitButton>
            </ActionForm>
            <p className="text-xs text-ink-faint">Archiving hides the product from the store but keeps it for reporting.</p>
          </div>
        </section>
      </div>
    </>
  );
}
