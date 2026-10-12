import Link from "next/link";
import { notFound } from "next/navigation";
import { enName, getCollection, listProductsForAssignment } from "@/lib/admin/queries";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { Banner, PageHeader } from "@/components/admin/ui";
import { btnDanger, section, sectionHead } from "@/components/admin/styles";
import { deleteCollectionAction } from "../actions";

export const metadata = { title: "Edit collection" };

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [collection, products] = await Promise.all([getCollection(id), listProductsForAssignment()]);
  if (!collection) notFound();
  const name = enName(collection.translations, collection.slug);
  return (
    <>
      <PageHeader title={name} eyebrow="Edit collection" actions={<Link href="/admin/collections" className="text-xs underline underline-offset-4">Back to collections</Link>} />
      {sp.created ? <Banner>Collection created.</Banner> : null}
      <div className="space-y-6">
        <CollectionForm
          products={products}
          collection={{
            id: collection.id,
            slug: collection.slug,
            active: collection.active,
            sortOrder: collection.sortOrder,
            image: collection.image,
            translations: Object.fromEntries(collection.translations.map((t) => [t.locale, { name: t.name, description: t.description }])),
            productIds: collection.products.map((p) => p.id),
          }}
        />
        <section className={section}>
          <div className={sectionHead}><h2 className="eyebrow">Delete</h2></div>
          <div className="p-4">
            <ActionForm action={deleteCollectionAction}>
              <input type="hidden" name="id" value={collection.id} />
              <input type="hidden" name="redirect" value="1" />
              <SubmitButton className={btnDanger} confirm={`Delete collection “${name}”? Products stay in the catalogue.`}>Delete collection</SubmitButton>
            </ActionForm>
          </div>
        </section>
      </div>
    </>
  );
}
