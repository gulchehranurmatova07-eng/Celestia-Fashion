import Link from "next/link";
import { enName, listCollections } from "@/lib/admin/queries";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Banner, Empty, PageHeader, Thumb } from "@/components/admin/ui";
import { btnDark, btnGhost, section, table, td, th } from "@/components/admin/styles";
import { deleteCollectionAction, toggleCollectionAction } from "./actions";

export const metadata = { title: "Collections" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  const rows = await listCollections();
  return (
    <>
      <PageHeader
        title="Collections"
        eyebrow="Catalogue"
        description="Curated edits shown in the storefront. Deleting a collection never deletes its products."
        actions={<Link href="/admin/collections/new" className={btnDark}>New collection</Link>}
      />
      {sp.deleted ? <Banner>Collection deleted.</Banner> : null}
      <section className={section}>
        {rows.length === 0 ? (
          <Empty>No collections yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={table}>
              <thead className="border-b border-line">
                <tr>
                  <th className={th}><span className="sr-only">Image</span></th>
                  <th className={th}>Name</th>
                  <th className={th}>Slug</th>
                  <th className={th}>Products</th>
                  <th className={th}>Sort</th>
                  <th className={th}>Status</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => {
                  const name = enName(c.translations, c.slug);
                  return (
                    <tr key={c.id}>
                      <td className={`${td} w-14`}><Thumb src={c.image} /></td>
                      <td className={td}><Link href={`/admin/collections/${c.id}`} className="font-medium hover:underline">{name}</Link></td>
                      <td className={`${td} text-ink-soft`}>/{c.slug}</td>
                      <td className={td}>{c._count.products}</td>
                      <td className={td}>{c.sortOrder}</td>
                      <td className={td}><Badge tone={c.active ? "green" : "neutral"}>{c.active ? "Active" : "Inactive"}</Badge></td>
                      <td className={td}>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/collections/${c.id}`} className={btnGhost} aria-label={`Edit ${name}`}>Edit</Link>
                          <ActionForm action={toggleCollectionAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                            <SubmitButton className={btnGhost} aria-label={`${c.active ? "Deactivate" : "Activate"} ${name}`}>
                              {c.active ? "Deactivate" : "Activate"}
                            </SubmitButton>
                          </ActionForm>
                          <ActionForm action={deleteCollectionAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <SubmitButton className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`} confirm={`Delete collection “${name}”? Products stay in the catalogue.`} aria-label={`Delete ${name}`}>
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
      </section>
    </>
  );
}
