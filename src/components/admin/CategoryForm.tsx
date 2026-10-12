import { saveCategoryAction } from "@/app/admin/categories/actions";
import { ActionForm, FormStatus, SubmitButton } from "./ActionForm";
import { SelectField, TextField } from "./fields";
import { ImageUrlField } from "./ImageUrlField";
import { btnDark } from "./styles";

export function CategoryForm({
  category,
  parents,
}: {
  category?: { id: string; slug: string; parentId: string | null; sortOrder: number; image: string | null; names: Record<string, string> };
  parents: { id: string; label: string }[];
}) {
  return (
    <ActionForm action={saveCategoryAction} resetOnSuccess={!category} className="grid gap-4 p-4" aria-label={category ? "Edit category" : "New category"}>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <TextField label="Name (EN)" name="name_en" required defaultValue={category?.names.en ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name (RU)" name="name_ru" defaultValue={category?.names.ru ?? ""} hint="Falls back to English if empty" />
        <TextField label="Name (UZ)" name="name_uz" defaultValue={category?.names.uz ?? ""} hint="Falls back to English if empty" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Slug" name="slug" required defaultValue={category?.slug ?? ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" hint="lowercase-with-hyphens, unique" />
        <TextField label="Sort order" name="sortOrder" type="number" step={1} defaultValue={category?.sortOrder ?? 0} />
      </div>
      <SelectField
        label="Parent"
        name="parentId"
        defaultValue={category?.parentId ?? ""}
        options={[
          { value: "", label: "— Top level —" },
          ...parents.filter((p) => p.id !== category?.id).map((p) => ({ value: p.id, label: p.label })),
        ]}
      />
      <ImageUrlField label="Image" name="image" defaultValue={category?.image ?? ""} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton className={btnDark} pendingText="Saving…">{category ? "Save category" : "Create category"}</SubmitButton>
        <FormStatus />
      </div>
    </ActionForm>
  );
}
