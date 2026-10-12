import Link from "next/link";
import { getProductFormOptions } from "@/lib/admin/queries";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const options = await getProductFormOptions();
  return (
    <>
      <PageHeader
        title="New product"
        eyebrow="Catalogue"
        description="Images can be added after the product has been created."
        actions={<Link href="/admin/products" className="text-xs underline underline-offset-4">Back to products</Link>}
      />
      <ProductEditor options={options} />
    </>
  );
}
