import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiscount } from "@/lib/admin/queries";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { PageHeader } from "@/components/admin/ui";
import { btnDanger, section, sectionHead } from "@/components/admin/styles";
import { deleteDiscountAction } from "../actions";

export const metadata = { title: "Edit discount" };

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDiscount(id);
  if (!d) notFound();
  return (
    <>
      <PageHeader
        title={d.code}
        eyebrow="Edit discount code"
        description={`Used ${d.usedCount} time${d.usedCount === 1 ? "" : "s"}${d.maxUses != null ? ` of ${d.maxUses}` : ""}.`}
        actions={<Link href="/admin/discounts" className="text-xs underline underline-offset-4">Back to discounts</Link>}
      />
      <div className="grid max-w-3xl gap-6">
        <section className={section}><DiscountForm discount={d} /></section>
        <section className={section}>
          <div className={sectionHead}><h2 className="eyebrow">Delete</h2></div>
          <div className="p-4">
            <ActionForm action={deleteDiscountAction}>
              <input type="hidden" name="id" value={d.id} />
              <input type="hidden" name="redirect" value="1" />
              <SubmitButton className={btnDanger} confirm={`Delete code ${d.code}?`}>Delete code</SubmitButton>
            </ActionForm>
          </div>
        </section>
      </div>
    </>
  );
}
