import Link from "next/link";
import { enName, listCategoryTree } from "@/lib/admin/queries";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Banner, PageHeader, Thumb } from "@/components/admin/ui";
import { btnGhost, section, sectionHead } from "@/components/admin/styles";
import { deleteCategoryAction } from "./actions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ created?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const { tree } = await listCategoryTree();
  const parents = tree.map(({ node, depth }) => ({ id: node.id, label: `${"— ".repeat(depth)}${enName(node.translations, node.slug)}` }));

  return (
    <>
      <PageHeader title="Categories" eyebrow="Catalogue" description="Categories can only be deleted when they have no products and no subcategories." />
      {sp.created ? <Banner>Category created.</Banner> : null}
      {sp.deleted ? <Banner>Category deleted.</Banner> : null}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className={section} aria-labelledby="tree-h">
          <div className={sectionHead}>
            <h2 id="tree-h" className="eyebrow">Category tree</h2>
            <span className="text-xs text-ink-faint">{tree.length} categories</span>
          </div>
          <ul className="divide-y divide-line">
            {tree.map(({ node, depth }) => {
              const name = enName(node.translations, node.slug);
              const missing = ["ru", "uz"].filter((l) => !node.translations.some((t) => t.locale === l && t.name));
              return (
                <li key={node.id} className="flex items-center gap-3 py-2 pr-4" style={{ paddingLeft: `${16 + depth * 28}px` }}>
                  {depth > 0 ? <span className="text-ink-faint" aria-hidden="true">└</span> : null}
                  <Thumb src={node.image} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/categories/${node.id}`} className="font-medium hover:underline">{name}</Link>
                    <p className="text-xs text-ink-faint">
                      /{node.slug} · {node._count.products} product{node._count.products === 1 ? "" : "s"} · {node._count.children} sub · sort {node.sortOrder}
                      {missing.length ? ` · missing ${missing.join("/").toUpperCase()}` : ""}
                    </p>
                  </div>
                  <Link href={`/admin/categories/${node.id}`} className={btnGhost} aria-label={`Edit ${name}`}>Edit</Link>
                  <ActionForm action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={node.id} />
                    <SubmitButton className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`} confirm={`Delete category “${name}”?`} aria-label={`Delete ${name}`}>
                      Delete
                    </SubmitButton>
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        </section>
        <section className={`${section} self-start`} aria-labelledby="new-h">
          <div className={sectionHead}>
            <h2 id="new-h" className="eyebrow">New category</h2>
          </div>
          <CategoryForm parents={parents} />
        </section>
      </div>
    </>
  );
}
