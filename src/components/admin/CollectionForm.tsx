import { saveCollectionAction } from "@/app/admin/collections/actions";
import { ActionForm, FormStatus, SubmitButton } from "./ActionForm";
import { Checkbox, TextArea, TextField } from "./fields";
import { ImageUrlField } from "./ImageUrlField";
import { ProductPicker } from "./ProductPicker";
import { btnDark, section, sectionHead } from "./styles";

type Tr = { name: string; description: string };

export function CollectionForm({
  collection,
  products,
}: {
  collection?: { id: string; slug: string; active: boolean; sortOrder: number; image: string | null; translations: Record<string, Tr>; productIds: string[] };
  products: { id: string; sku: string; name: string; status: string; isDemo: boolean }[];
}) {
  const t = collection?.translations ?? {};
  return (
    <ActionForm action={saveCollectionAction} className="space-y-6" aria-label="Collection">
      {collection ? <input type="hidden" name="id" value={collection.id} /> : null}
      <section className={section}>
        <div className={sectionHead}><h2 className="eyebrow">Details</h2></div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <TextField label="Slug" name="slug" required defaultValue={collection?.slug ?? ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" hint="lowercase-with-hyphens, unique" />
          <TextField label="Sort order" name="sortOrder" type="number" step={1} defaultValue={collection?.sortOrder ?? 0} />
          <div className="flex items-end pb-2">
            <Checkbox label="Active (visible in store)" name="active" defaultChecked={collection?.active ?? true} />
          </div>
          <div className="md:col-span-3">
            <ImageUrlField label="Image" name="image" defaultValue={collection?.image ?? ""} />
          </div>
        </div>
      </section>
      <section className={section}>
        <div className={sectionHead}><h2 className="eyebrow">Name & description</h2><span className="text-xs text-ink-faint">RU/UZ fall back to English if empty</span></div>
        <div className="grid gap-6 p-4 lg:grid-cols-3">
          {(["en", "ru", "uz"] as const).map((l) => (
            <div key={l} className="space-y-3">
              <TextField label={`Name (${l.toUpperCase()})`} name={`name_${l}`} required={l === "en"} defaultValue={t[l]?.name ?? ""} />
              <TextArea label={`Description (${l.toUpperCase()})`} name={`description_${l}`} rows={4} defaultValue={t[l]?.description ?? ""} />
            </div>
          ))}
        </div>
      </section>
      <section className={section}>
        <div className={sectionHead}><h2 className="eyebrow">Products</h2></div>
        <div className="p-4">
          <ProductPicker name="productIds" products={products} selected={collection?.productIds ?? []} />
        </div>
      </section>
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 border border-line bg-white px-4 py-3">
        <SubmitButton className={btnDark} pendingText="Saving…">{collection ? "Save collection" : "Create collection"}</SubmitButton>
        <FormStatus />
      </div>
    </ActionForm>
  );
}
