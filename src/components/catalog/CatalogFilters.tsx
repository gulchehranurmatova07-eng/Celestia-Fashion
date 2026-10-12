"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Facets } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { ChevronDown, CloseIcon, FilterIcon } from "@/components/ui/Icons";
import { useFilterNav } from "./useFilterNav";

export type FilterCategory = { slug: string; name: string; count: number; children: { slug: string; name: string; count: number }[] };

type Props = {
  basePath: string;
  query: Record<string, string>;
  facets: Facets;
  categories: FilterCategory[];
  total: number;
  hide?: ("gender" | "category")[];
};

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xs font-medium uppercase tracking-wide2 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-sm text-ink-soft hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-obsidian" />
      <span className={clsx(checked && "text-ink")}>{children}</span>
    </label>
  );
}

function FilterBody({ basePath, query, facets, categories, hide = [] }: Props) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { go, toggleList, pending } = useFilterNav(basePath, query);
  const sel = (k: string) => (query[k] ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(query.min ?? "");
  const [max, setMax] = useState(query.max ?? "");

  return (
    <div className={clsx("transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {!hide.includes("gender") && (
        <Group title={t("groups.gender")}>
          <div className="flex flex-col">
            {(["men", "women", "unisex"] as const).map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-3 py-1 text-sm text-ink-soft hover:text-ink">
                <input type="radio" name="gender" checked={query.gender === g} onChange={() => go({ gender: g })} className="h-4 w-4 accent-obsidian" />
                {t(`gender.${g}`)}
              </label>
            ))}
            {query.gender && (
              <button type="button" onClick={() => go({ gender: null })} className="mt-1 self-start text-xs underline underline-offset-4">{tc("actions.clear")}</button>
            )}
          </div>
        </Group>
      )}

      {!hide.includes("category") && categories.length > 0 && (
        <Group title={t("groups.category")}>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <button type="button" onClick={() => go({ category: query.category === c.slug ? null : c.slug })} aria-pressed={query.category === c.slug} className={clsx("py-1 text-left text-sm hover:text-ink", query.category === c.slug ? "font-medium text-ink" : "text-ink-soft")}>
                  {c.name} <span className="text-ink-faint">({c.count})</span>
                </button>
                {c.children.length > 0 && (
                  <ul className="ml-3 border-l border-line pl-3">
                    {c.children.map((ch) => (
                      <li key={ch.slug}>
                        <button type="button" onClick={() => go({ category: query.category === ch.slug ? null : ch.slug })} aria-pressed={query.category === ch.slug} className={clsx("py-1 text-left text-[13px] hover:text-ink", query.category === ch.slug ? "font-medium text-ink" : "text-ink-soft")}>
                          {ch.name} <span className="text-ink-faint">({ch.count})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Group>
      )}

      {facets.sizes.length > 0 && (
        <Group title={t("groups.size")}>
          <div className="grid grid-cols-4 gap-1.5">
            {facets.sizes.map((s) => {
              const on = sel("size").includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => toggleList("size", s)} className={clsx("h-9 border text-xs transition-colors", on ? "border-obsidian bg-obsidian text-ivory" : "border-line hover:border-obsidian")}>
                  {s === "OS" ? tc("product.oneSize") : s}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title={t("groups.color")}>
          <div className="grid grid-cols-2 gap-y-1">
            {facets.colors.map((c) => {
              const on = sel("color").includes(c.slug);
              return (
                <button key={c.slug} type="button" aria-pressed={on} onClick={() => toggleList("color", c.slug)} className={clsx("flex items-center gap-2 py-1 text-left text-sm", on ? "text-ink" : "text-ink-soft hover:text-ink")}>
                  <span className={clsx("h-4 w-4 shrink-0 rounded-full border", on ? "border-obsidian shadow-[0_0_0_2px_white,0_0_0_3px_#111]" : "border-line")} style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.brands.length > 1 && (
        <Group title={t("groups.brand")}>
          {facets.brands.map((b) => (
            <Check key={b.slug} checked={sel("brand").includes(b.slug)} onChange={() => toggleList("brand", b.slug)}>
              {b.name} <span className="text-ink-faint">({b.count})</span>
            </Check>
          ))}
        </Group>
      )}

      <Group title={t("groups.price")}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            go({ min: min.replace(/\D/g, "") || null, max: max.replace(/\D/g, "") || null });
          }}
        >
          <div className="flex items-center gap-2">
            <label className="flex-1">
              <span className="sr-only">{t("priceMin")}</span>
              <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder={`${t("priceMin")} ${formatPrice(facets.priceMin, locale)}`} className="field h-10 px-3 text-xs" />
            </label>
            <span aria-hidden="true">—</span>
            <label className="flex-1">
              <span className="sr-only">{t("priceMax")}</span>
              <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder={`${t("priceMax")} ${formatPrice(facets.priceMax, locale)}`} className="field h-10 px-3 text-xs" />
            </label>
          </div>
          <button type="submit" className="btn-outline h-10 w-full">{t("priceApply")}</button>
        </form>
      </Group>

      <Group title={t("groups.availability")}>
        <Check checked={query.available === "1"} onChange={() => go({ available: query.available === "1" ? null : "1" })}>{t("inStockOnly")}</Check>
        <Check checked={query.sale === "1"} onChange={() => go({ sale: query.sale === "1" ? null : "1" })}>{t("saleOnly")}</Check>
        <Check checked={query.new === "1"} onChange={() => go({ new: query.new === "1" ? null : "1" })}>{t("newOnly")}</Check>
      </Group>
    </div>
  );
}

export function CatalogFilters(props: Props) {
  const t = useTranslations("catalog");
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden lg:block" aria-label={t("filters")}>
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100vh-var(--header-h)-3rem)] overflow-y-auto pr-2">
          <FilterBody {...props} />
        </div>
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 border border-line px-4 text-2xs font-medium uppercase tracking-wide2 lg:hidden" aria-haspopup="dialog">
        <FilterIcon size={18} /> {t("filters")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label={t("filters")} variant="left">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-2xl">{t("filters")}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("hideFilters")} className="-mr-2 p-2"><CloseIcon /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5"><FilterBody {...props} /></div>
          <div className="border-t border-line p-5">
            <button type="button" className="btn-dark w-full" onClick={() => setOpen(false)}>{t("showResults", { count: props.total })}</button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
