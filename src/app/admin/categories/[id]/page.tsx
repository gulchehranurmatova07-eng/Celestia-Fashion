import Link from "next/link";
import { notFound } from "next/navigation";
import { enName, getCategory, listCategoryTree } from "@/lib/admin/queries";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { PageHeader } from "@/components/admin/ui";
import { btnDanger, section, sectionHead } from "@/components/admin/styles";
import { deleteCategoryAction } from "../actions";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, { tree }] = await Promise.all([getCategory(id), listCategoryTree()]);
  if (!category) notFound();
  const names = Object.fromEntries(category.translations.map((t) => [t.locale, t.name]));
  const parents = tree.map(({ node, depth }) => ({ id: node.id, label: `${"— ".repeat(depth)}${enName(node.translations, node.slug)}` }));
  const name = enName(category.translations, category.slug);

  return (
    <>
      <PageHeader
        title={name}
        eyebrow="Edit category"
        description={`${category._count.products} product(s) · ${category._count.children} subcategor${category._count.children === 1 ? "y" : "ies"}`}
        actions={<Link href="/admin/categories" className="text-xs underline underline-offset-4">Back to categories</Link>}
      />
      <div className="grid max-w-3xl gap-6">
        <section className={section}>
          <CategoryForm
            category={{ id: category.id, slug: category.slug, parentId: category.parentId, sortOrder: category.sortOrder, image: category.image, names }}
            parents={parents}
          />
        </section>
        <section className={section} aria-labelledby="del-h">
          <div className={sectionHead}><h2 id="del-h" className="eyebrow">Delete</h2></div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <ActionForm action={deleteCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="redirect" value="1" />
              <SubmitButton className={btnDanger} confirm={`Delete category “${name}”?`}>Delete category</SubmitButton>
            </ActionForm>
            <p className="text-xs text-ink-faint">Only possible when it has no products and no subcategories.</p>
          </div>
        </section>
      </div>
    </>
  );
}
