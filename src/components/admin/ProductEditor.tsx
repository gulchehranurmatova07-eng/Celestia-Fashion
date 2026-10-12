"use client";

import { useMemo, useState } from "react";
import { createColorAction, saveProductAction } from "@/app/admin/products/actions";
import { GENDERS, LOCALES, PRODUCT_STATUSES, SIZE_CHARTS, sortSizes, type Locale } from "@/lib/constants";
import { ActionForm, FieldError, FormStatus, SubmitButton } from "./ActionForm";
import { Checkbox, SelectField, TextArea, TextField } from "./fields";
import { btnDark, btnGhost, input, label as labelCls, section, sectionHead } from "./styles";

type Translation = { name: string; description: string; materials: string; care: string };
type VariantIn = { id: string; colorId: string; size: string; sku: string; stock: number; orders: number };

export type ProductEditorProps = {
  product?: {
    id: string;
    slug: string;
    sku: string;
    status: string;
    gender: string;
    categoryId: string;
    brandId: string;
    price: number;
    compareAtPrice: number | null;
    isNew: boolean;
    trending: boolean;
    isDemo: boolean;
    sortWeight: number;
    sizeChart: string;
    collectionIds: string[];
    translations: Partial<Record<Locale, Translation>>;
    variants: VariantIn[];
  };
  options: {
    categories: { id: string; label: string }[];
    brands: { id: string; name: string }[];
    colors: { id: string; slug: string; hex: string; nameEn: string }[];
    collections: { id: string; label: string; active: boolean }[];
  };
};

const LOCALE_LABEL: Record<Locale, string> = { en: "English", ru: "Русский", uz: "O‘zbekcha" };

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Tops S–XL", sizes: ["S", "M", "L", "XL"] },
  { label: "Tailoring 46–54", sizes: ["46", "48", "50", "52", "54"] },
  { label: "Trousers 30–36", sizes: ["30", "31", "32", "33", "34", "36"] },
  { label: "Shoes 40–45", sizes: ["40", "41", "42", "43", "44", "45"] },
  { label: "Belts 85–100", sizes: ["85", "90", "95", "100"] },
  { label: "One size", sizes: ["OS"] },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const keyOf = (colorId: string, size: string) => `${colorId}|${size.toUpperCase()}`;
const color3 = (slug: string) => (slug.replace(/[^a-z0-9]/gi, "").slice(0, 3) || "CLR").toUpperCase();
const normSize = (s: string) => s.trim().replace(/\s+/g, "").toUpperCase().slice(0, 16);

type Cell = { sku: string; stock: string; skuEdited: boolean };

export function ProductEditor({ product, options }: ProductEditorProps) {
  const isEdit = Boolean(product);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [sku, setSku] = useState(product?.sku ?? "");
  const [enName, setEnName] = useState(product?.translations.en?.name ?? "");
  const [tab, setTab] = useState<Locale>("en");
  const [filled, setFilled] = useState<Record<Locale, { name: boolean; description: boolean }>>(() => {
    const out = {} as Record<Locale, { name: boolean; description: boolean }>;
    for (const l of LOCALES) {
      out[l] = { name: Boolean(product?.translations[l]?.name), description: Boolean(product?.translations[l]?.description) };
    }
    return out;
  });

  // Variant matrix state
  const original = useMemo(() => {
    const m = new Map<string, VariantIn>();
    for (const v of product?.variants ?? []) m.set(keyOf(v.colorId, v.size), v);
    return m;
  }, [product?.variants]);
  const [colorIds, setColorIds] = useState<string[]>(() => [...new Set((product?.variants ?? []).map((v) => v.colorId))]);
  const [sizes, setSizes] = useState<string[]>(() => sortSizes([...new Set((product?.variants ?? []).map((v) => v.size))]));
  const [cells, setCells] = useState<Record<string, Cell>>(() => {
    const out: Record<string, Cell> = {};
    for (const v of product?.variants ?? []) out[keyOf(v.colorId, v.size)] = { sku: v.sku, stock: String(v.stock), skuEdited: true };
    return out;
  });
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  const colorById = useMemo(() => new Map(options.colors.map((c) => [c.id, c])), [options.colors]);
  const autoSku = (colorId: string, size: string) =>
    `${(sku || "SKU").toUpperCase()}-${color3(colorById.get(colorId)?.slug ?? "")}-${size.toUpperCase()}`;

  const matrix = colorIds
    .filter((id) => colorById.has(id))
    .flatMap((colorId) =>
      sizes.map((size) => {
        const k = keyOf(colorId, size);
        const cell = cells[k];
        return {
          key: k,
          colorId,
          size,
          sku: cell?.skuEdited ? cell.sku : autoSku(colorId, size),
          stock: cell?.stock ?? "0",
          existing: original.get(k),
        };
      }),
    );
  const removedWithOrders = [...original.entries()]
    .filter(([k]) => !matrix.some((m) => m.key === k))
    .map(([, v]) => v);

  const variantsJson = JSON.stringify(
    matrix.map((m) => ({ colorId: m.colorId, size: m.size, sku: m.sku.trim(), stock: Number(m.stock) || 0 })),
  );

  function updateCell(k: string, patch: Partial<Cell>, colorId: string, size: string) {
    setCells((prev) => {
      const cur = prev[k] ?? { sku: autoSku(colorId, size), stock: "0", skuEdited: false };
      return { ...prev, [k]: { ...cur, ...patch } };
    });
  }

  function addSizes(raw: string) {
    const next = raw.split(/[,;\n]/).map(normSize).filter(Boolean);
    if (!next.length) return;
    setSizes((prev) => sortSizes([...new Set([...prev, ...next])]));
    setSizeDraft("");
  }

  function toggleColor(id: string) {
    setColorIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function regenerateSkus() {
    setCells((prev) => {
      const out: Record<string, Cell> = {};
      for (const [k, v] of Object.entries(prev)) out[k] = { ...v, skuEdited: false };
      return out;
    });
  }

  function onNameChange(l: Locale, field: "name" | "description", value: string) {
    setFilled((f) => ({ ...f, [l]: { ...f[l], [field]: value.trim().length > 0 } }));
    if (l === "en" && field === "name") {
      setEnName(value);
      if (!slugTouched) setSlug(slugify(value));
    }
  }

  const visibleColors = options.colors.filter(
    (c) => colorIds.includes(c.id) || !colorFilter || `${c.nameEn} ${c.slug}`.toLowerCase().includes(colorFilter.toLowerCase()),
  );

  return (
    <>
      <ActionForm action={saveProductAction} className="space-y-6" aria-label="Product details">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <input type="hidden" name="variants" value={variantsJson} />

        {/* ---------------- Basics ---------------- */}
        <section className={section} aria-labelledby="basics-h">
          <div className={sectionHead}>
            <h2 id="basics-h" className="eyebrow">Basics</h2>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="p-slug" className={labelCls}>
                Slug <span aria-hidden="true">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="p-slug"
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase letters, numbers and hyphens"
                  className={input}
                  aria-describedby="p-slug-hint"
                />
                <button type="button" className={btnGhost} onClick={() => setSlug(slugify(enName))} disabled={!enName}>
                  From name
                </button>
              </div>
              <p id="p-slug-hint" className="mt-1 text-xs text-ink-faint">
                URL: /product/{slug || "…"} · must be unique
              </p>
              <FieldError name="slug" />
            </div>
            <div>
              <label htmlFor="p-sku" className={labelCls}>
                SKU <span aria-hidden="true">*</span>
              </label>
              <input
                id="p-sku"
                name="sku"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`${input} font-mono`}
                placeholder="CA-BL-001"
              />
              <FieldError name="sku" />
            </div>
            <SelectField
              label="Status"
              name="status"
              defaultValue={product?.status ?? "DRAFT"}
              options={PRODUCT_STATUSES.map((s) => ({ value: s, label: s }))}
              hint="Only ACTIVE products are visible in the store."
            />
            <SelectField
              label="Gender"
              name="gender"
              defaultValue={product?.gender ?? "MEN"}
              options={GENDERS.map((g) => ({ value: g, label: g }))}
            />
            <SelectField
              label="Category"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              options={[{ value: "", label: "— Choose a category —" }, ...options.categories.map((c) => ({ value: c.id, label: c.label }))]}
            />
            <div>
              <SelectField
                label="Brand"
                name="brandId"
                defaultValue={product?.brandId ?? options.brands[0]?.id ?? ""}
                options={[{ value: "", label: "— Choose a brand —" }, ...options.brands.map((b) => ({ value: b.id, label: b.name }))]}
              />
              <div className="mt-2">
                <TextField label="…or create a new brand" name="newBrandName" placeholder="New brand name" hint="If filled, this brand is created and used." />
              </div>
            </div>
            <TextField label="Price (UZS)" name="price" type="number" min={1} step={1} required defaultValue={product?.price ?? ""} inputMode="numeric" />
            <TextField
              label="Compare-at price (UZS)"
              name="compareAtPrice"
              type="number"
              min={1}
              step={1}
              defaultValue={product?.compareAtPrice ?? ""}
              hint="Optional. Must be higher than the price to show as a sale."
              inputMode="numeric"
            />
            <TextField
              label="Sort weight"
              name="sortWeight"
              type="number"
              step={1}
              defaultValue={product?.sortWeight ?? 0}
              hint="Higher values rank first in “Recommended”."
            />
            <SelectField
              label="Size chart"
              name="sizeChart"
              defaultValue={product?.sizeChart ?? "tops"}
              options={SIZE_CHARTS.map((s) => ({ value: s, label: s }))}
            />
            <fieldset className="space-y-2 md:col-span-2 xl:col-span-2">
              <legend className={labelCls}>Flags</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Checkbox label="New arrival" name="isNew" defaultChecked={product?.isNew} />
                <Checkbox label="Trending" name="trending" defaultChecked={product?.trending} />
                <Checkbox
                  label="Demo product"
                  name="isDemo"
                  defaultChecked={product?.isDemo ?? false}
                  hint="Flagged for bulk archive before launch."
                />
              </div>
            </fieldset>
          </div>
        </section>

        {/* ---------------- Collections ---------------- */}
        <section className={section} aria-labelledby="collections-h">
          <div className={sectionHead}>
            <h2 id="collections-h" className="eyebrow">Collections</h2>
          </div>
          <fieldset className="p-4">
            <legend className="sr-only">Collections</legend>
            {options.collections.length === 0 ? (
              <p className="text-sm text-ink-faint">No collections yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {options.collections.map((c) => (
                  <Checkbox
                    key={c.id}
                    name="collectionIds"
                    value={c.id}
                    label={`${c.label}${c.active ? "" : " (inactive)"}`}
                    defaultChecked={product?.collectionIds.includes(c.id)}
                  />
                ))}
              </div>
            )}
          </fieldset>
        </section>

        {/* ---------------- Translations ---------------- */}
        <section className={section} aria-labelledby="content-h">
          <div className={sectionHead}>
            <h2 id="content-h" className="eyebrow">Content</h2>
            <span className="text-xs text-ink-faint">English name required; Russian & Uzbek recommended</span>
          </div>
          <div role="tablist" aria-label="Language" className="flex border-b border-line px-4">
            {LOCALES.map((l) => {
              const missing = l !== "en" && (!filled[l].name || !filled[l].description);
              const enMissing = l === "en" && !filled.en.name;
              return (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  id={`tab-${l}`}
                  aria-selected={tab === l}
                  aria-controls={`panel-${l}`}
                  onClick={() => setTab(l)}
                  className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-2xs font-medium uppercase tracking-wide2 ${
                    tab === l ? "border-obsidian text-obsidian" : "border-transparent text-ink-faint hover:text-obsidian"
                  }`}
                >
                  {l.toUpperCase()} <span className="hidden normal-case tracking-normal sm:inline">{LOCALE_LABEL[l]}</span>
                  {missing || enMissing ? (
                    <span
                      className={`border px-1 text-[9px] ${enMissing ? "border-[#9B1C1C] text-[#9B1C1C]" : "border-champagne-dark text-champagne-dark"}`}
                      title={enMissing ? "Required" : "Missing translation"}
                    >
                      {enMissing ? "Required" : "Missing"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {LOCALES.map((l) => {
            const t = product?.translations[l];
            return (
              <div key={l} role="tabpanel" id={`panel-${l}`} aria-labelledby={`tab-${l}`} hidden={tab !== l} className="grid gap-4 p-4">
                <div>
                  <label htmlFor={`name_${l}`} className={labelCls}>
                    Name ({l.toUpperCase()}){l === "en" ? <span aria-hidden="true"> *</span> : null}
                  </label>
                  <input
                    id={`name_${l}`}
                    name={`name_${l}`}
                    defaultValue={t?.name ?? ""}
                    maxLength={200}
                    className={input}
                    onChange={(e) => onNameChange(l, "name", e.target.value)}
                  />
                  <FieldError name={`translations.${l}.name`} />
                </div>
                <div>
                  <label htmlFor={`description_${l}`} className={labelCls}>
                    Description ({l.toUpperCase()})
                  </label>
                  <textarea
                    id={`description_${l}`}
                    name={`description_${l}`}
                    defaultValue={t?.description ?? ""}
                    rows={5}
                    className={`${input} h-auto py-2 leading-relaxed`}
                    onChange={(e) => onNameChange(l, "description", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextArea label={`Materials (${l.toUpperCase()})`} name={`materials_${l}`} rows={3} defaultValue={t?.materials ?? ""} />
                  <TextArea label={`Care (${l.toUpperCase()})`} name={`care_${l}`} rows={3} defaultValue={t?.care ?? ""} />
                </div>
                {l !== "en" ? (
                  <p className="text-xs text-ink-faint">Leave the name empty to fall back to English for this language.</p>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* ---------------- Variants ---------------- */}
        <section className={section} aria-labelledby="variants-h">
          <div className={sectionHead}>
            <h2 id="variants-h" className="eyebrow">Variants & stock</h2>
            <span className="text-xs text-ink-faint">
              {matrix.length} variant{matrix.length === 1 ? "" : "s"} · {matrix.reduce((s, m) => s + (Number(m.stock) || 0), 0)} units
            </span>
          </div>
          <div className="grid gap-6 p-4 lg:grid-cols-2">
            <fieldset>
              <legend className={labelCls}>Colours</legend>
              <input
                type="search"
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className={`${input} mb-2 h-9`}
                placeholder="Filter colours…"
                aria-label="Filter colours"
              />
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {visibleColors.map((c) => {
                  const on = colorIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleColor(c.id)}
                      className={`inline-flex items-center gap-2 border px-2.5 py-1.5 text-xs ${on ? "border-obsidian bg-ivory" : "border-line hover:border-obsidian"}`}
                    >
                      <span className="h-3.5 w-3.5 border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                      {c.nameEn}
                    </button>
                  );
                })}
              </div>
              <details className="mt-3 border border-line bg-[#FBFAF7] p-3">
                <summary className="cursor-pointer text-xs underline underline-offset-4">Add a new colour</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <NewColorInput label="Slug" name="colorSlug" placeholder="forest-green" />
                  <div>
                    <label htmlFor="nc-colorHex" className={labelCls}>Hex</label>
                    <div className="flex gap-2">
                      <input id="nc-colorHex" name="colorHex" form="add-color-form" className={input} placeholder="#2F4F3A" />
                    </div>
                  </div>
                  <NewColorInput label="Name EN" name="colorNameEn" placeholder="Forest green" />
                  <NewColorInput label="Name RU" name="colorNameRu" placeholder="Лесной зелёный" />
                  <NewColorInput label="Name UZ" name="colorNameUz" placeholder="O‘rmon yashili" />
                  <div className="flex items-end">
                    <button type="submit" form="add-color-form" className={btnDark}>
                      Add colour
                    </button>
                  </div>
                </div>
              </details>
            </fieldset>

            <div>
              <label htmlFor="size-draft" className={labelCls}>Sizes</label>
              <div className="flex gap-2">
                <input
                  id="size-draft"
                  value={sizeDraft}
                  onChange={(e) => setSizeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSizes(sizeDraft);
                    }
                  }}
                  className={input}
                  placeholder="e.g. S, M, L or 46, 48"
                  aria-describedby="size-hint"
                />
                <button type="button" className={btnGhost} onClick={() => addSizes(sizeDraft)}>
                  Add
                </button>
              </div>
              <p id="size-hint" className="mt-1 text-xs text-ink-faint">Comma-separated; press Enter to add.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((p) => (
                  <button key={p.label} type="button" className="border border-dashed border-line px-2 py-1 text-[11px] hover:border-obsidian" onClick={() => addSizes(p.sizes.join(","))}>
                    + {p.label}
                  </button>
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected sizes">
                {sizes.map((s) => (
                  <li key={s} className="inline-flex items-center gap-1 border border-obsidian px-2 py-1 text-xs">
                    {s}
                    <button type="button" onClick={() => setSizes((prev) => prev.filter((x) => x !== s))} aria-label={`Remove size ${s}`} className="px-1 text-ink-faint hover:text-obsidian">
                      ×
                    </button>
                  </li>
                ))}
                {sizes.length === 0 ? <li className="text-xs text-ink-faint">No sizes yet.</li> : null}
              </ul>
            </div>
          </div>

          {matrix.length > 0 ? (
            <div className="border-t border-line">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <p className="text-xs text-ink-faint">SKUs are generated as PRODUCTSKU-COL-SIZE unless you edit them.</p>
                <button type="button" className="text-xs underline underline-offset-4" onClick={regenerateSkus}>
                  Regenerate all SKUs
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-y border-line bg-[#FBFAF7]">
                    <tr>
                      <th className="px-4 py-2 text-left text-2xs uppercase tracking-wide2 text-ink-faint">Colour</th>
                      <th className="px-4 py-2 text-left text-2xs uppercase tracking-wide2 text-ink-faint">Size</th>
                      <th className="px-4 py-2 text-left text-2xs uppercase tracking-wide2 text-ink-faint">SKU</th>
                      <th className="px-4 py-2 text-left text-2xs uppercase tracking-wide2 text-ink-faint">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {matrix.map((m) => {
                      const c = colorById.get(m.colorId)!;
                      const desc = `${c.nameEn} / ${m.size}`;
                      return (
                        <tr key={m.key}>
                          <td className="px-4 py-1.5">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-3 w-3 border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                              {c.nameEn}
                            </span>
                          </td>
                          <td className="px-4 py-1.5">
                            {m.size} {m.existing ? null : <span className="ml-1 text-[10px] uppercase text-champagne-dark">new</span>}
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              value={m.sku}
                              onChange={(e) => updateCell(m.key, { sku: e.target.value, skuEdited: true }, m.colorId, m.size)}
                              className={`${input} h-8 font-mono text-xs`}
                              aria-label={`SKU for ${desc}`}
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={m.stock}
                              onChange={(e) => updateCell(m.key, { stock: e.target.value, sku: m.sku }, m.colorId, m.size)}
                              className={`${input} h-8 w-24`}
                              aria-label={`Stock for ${desc}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="border-t border-line px-4 py-4 text-sm text-ink-faint">
              Select at least one colour and one size to create variants. A product without variants cannot be purchased.
            </p>
          )}
          {removedWithOrders.length > 0 ? (
            <p className="border-t border-line bg-ivory px-4 py-3 text-xs text-ink-soft" role="note">
              {removedWithOrders.length} existing variant{removedWithOrders.length === 1 ? "" : "s"} will be removed on save (
              {removedWithOrders.map((v) => v.sku).join(", ")}).
              {removedWithOrders.some((v) => v.orders > 0) ? " Past orders keep their item snapshot." : ""}
            </p>
          ) : null}
        </section>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 border border-line bg-white px-4 py-3">
          <SubmitButton className={btnDark} pendingText="Saving…">
            {isEdit ? "Save product" : "Create product"}
          </SubmitButton>
          <FormStatus />
        </div>
      </ActionForm>

      {/* Separate form for adding colours; its inputs live inside the editor via the `form` attribute. */}
      <ActionForm
        id="add-color-form"
        action={createColorAction}
        resetOnSuccess
        aria-label="Add colour"
        onResult={(r) => {
          const id = r.data?.id;
          if (r.ok && id) setColorIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        }}
      >
        <span hidden />
      </ActionForm>
    </>
  );
}

function NewColorInput({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={`nc-${name}`} className={labelCls}>
        {label}
      </label>
      <input id={`nc-${name}`} name={name} form="add-color-form" className={input} placeholder={placeholder} />
    </div>
  );
}
