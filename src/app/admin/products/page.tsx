import Link from "next/link";
import { categoryLabel, enName, listProducts } from "@/lib/admin/queries";
import { money } from "@/lib/admin/format";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Banner, Empty, PageHeader, Pagination, Thumb, statusTone } from "@/components/admin/ui";
import { btnDark, btnGhost, btnOutline, input, label, section, table, td, th } from "@/components/admin/styles";
import { archiveDemoProductsAction, deleteProductAction, setProductStatusAction } from "./actions";

export const metadata = { title: "Products" };

type SP = Promise<{ q?: string; status?: string; demo?: string; page?: string; deleted?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const data = await listProducts(sp);
  const qs = (page: number) => {
    const p = new URLSearchParams();
    if (data.q) p.set("q", data.q);
    if (data.status) p.set("status", data.status);
    if (sp.demo === "1") p.set("demo", "1");
    p.set("page", String(page));
    return `/admin/products?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        eyebrow="Catalogue"
        description={`${data.total} product${data.total === 1 ? "" : "s"} match the current filters.`}
        actions={
          <>
            {data.demoCount > 0 ? (
              <ActionForm action={archiveDemoProductsAction}>
                <input type="hidden" name="confirm" value="ARCHIVE" />
                <SubmitButton
                  className={btnOutline}
                  confirm={`Archive all ${data.demoCount} active demo products? They will disappear from the storefront but can be restored or deleted later.`}
                >
                  Archive all demo products ({data.demoCount})
                </SubmitButton>
              </ActionForm>
            ) : null}
            <Link href="/admin/products/new" className={btnDark}>
              New product
            </Link>
          </>
        }
      />

      {sp.deleted ? <Banner>Product deleted.</Banner> : null}

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label="Filter products">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="pq" className={label}>Search name or SKU</label>
          <input id="pq" name="q" type="search" defaultValue={data.q} className={input} placeholder="e.g. blazer or CA-BL-001" />
        </div>
        <div>
          <label htmlFor="pstatus" className={label}>Status</label>
          <select id="pstatus" name="status" defaultValue={data.status} className={input}>
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex h-10 items-center gap-2">
          <input id="pdemo" name="demo" type="checkbox" value="1" defaultChecked={sp.demo === "1"} className="h-4 w-4 accent-obsidian" />
          <label htmlFor="pdemo" className="text-sm">Demo only</label>
        </div>
        <button type="submit" className={btnDark}>Apply</button>
        {(data.q || data.status || sp.demo) ? (
          <Link href="/admin/products" className={btnGhost}>Reset</Link>
        ) : null}
      </form>

      <section className={section}>
        {data.rows.length === 0 ? (
          <Empty>No products found.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={`${table} min-w-[960px]`}>
              <thead className="border-b border-line">
                <tr>
                  <th className={th}><span className="sr-only">Image</span></th>
                  <th className={th}>Name</th>
                  <th className={th}>SKU</th>
                  <th className={th}>Category</th>
                  <th className={th}>Price</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Status</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((p) => {
                  const name = enName(p.translations, p.slug);
                  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
                  return (
                    <tr key={p.id}>
                      <td className={`${td} w-14`}><Thumb src={p.images[0]?.url} alt="" /></td>
                      <td className={td}>
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{name}</Link>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.isDemo ? <Badge tone="amber">Demo</Badge> : null}
                          {p.isNew ? <Badge>New</Badge> : null}
                          {p.trending ? <Badge>Trending</Badge> : null}
                        </div>
                      </td>
                      <td className={`${td} font-mono text-xs`}>{p.sku}</td>
                      <td className={`${td} text-ink-soft`}>{categoryLabel(p.category)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {money(p.price)}
                        {onSale ? <div className="text-xs text-ink-faint line-through">{money(p.compareAtPrice!)}</div> : null}
                      </td>
                      <td className={td}>
                        <span className={stock === 0 ? "text-[#9B1C1C]" : ""}>{stock}</span>
                        <span className="text-xs text-ink-faint"> / {p.variants.length} var.</span>
                      </td>
                      <td className={td}><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${p.id}`} className={btnGhost} aria-label={`Edit ${name}`}>Edit</Link>
                          <ActionForm action={setProductStatusAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="status" value={p.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"} />
                            <SubmitButton className={btnGhost} aria-label={`${p.status === "ARCHIVED" ? "Unarchive" : "Archive"} ${name}`}>
                              {p.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                            </SubmitButton>
                          </ActionForm>
                          <ActionForm action={deleteProductAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <SubmitButton
                              className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`}
                              aria-label={`Delete ${name}`}
                              confirm={`Permanently delete “${name}”?${p._count.orderItems ? ` It appears in ${p._count.orderItems} order line(s); those orders keep their snapshot.` : ""} This cannot be undone.`}
                            >
                              Delete
                            </SubmitButton>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} pages={data.pages} makeHref={qs} />
      </section>
    </>
  );
}
