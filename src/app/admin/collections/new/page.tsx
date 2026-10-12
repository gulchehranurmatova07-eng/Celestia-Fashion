import Link from "next/link";
import { listProductsForAssignment } from "@/lib/admin/queries";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  const products = await listProductsForAssignment();
  return (
    <>
      <PageHeader title="New collection" eyebrow="Catalogue" actions={<Link href="/admin/collections" className="text-xs underline underline-offset-4">Back to collections</Link>} />
      <CollectionForm products={products} />
    </>
  );
}
