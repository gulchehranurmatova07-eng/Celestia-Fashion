"use client";

import { useId, useState } from "react";
import { input } from "./styles";

type Item = { id: string; sku: string; name: string; status: string; isDemo: boolean };

/** Checkbox list of products with a client-side filter (all boxes stay in the form). */
export function ProductPicker({ name, products, selected }: { name: string; products: Item[]; selected: string[] }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState(() => new Set(selected));
  const [onlySelected, setOnlySelected] = useState(false);
  const match = (p: Item) =>
    (!onlySelected || checked.has(p.id)) && (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <fieldset>
      <legend className="mb-1.5 block text-2xs font-medium uppercase tracking-wide2 text-ink-soft">
        Products ({checked.size} selected)
      </legend>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${input} h-9 max-w-xs`}
          placeholder="Filter by name or SKU"
          aria-label="Filter products"
        />
        <label className="flex items-center gap-2 text-xs" htmlFor={`${id}-only`}>
          <input id={`${id}-only`} type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} className="accent-obsidian" />
          Show selected only
        </label>
      </div>
      <ul className="max-h-96 divide-y divide-line overflow-y-auto border border-line">
        {products.map((p) => (
          <li key={p.id} hidden={!match(p)}>
            <label htmlFor={`${id}-${p.id}`} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-ivory/60">
              <input
                id={`${id}-${p.id}`}
                type="checkbox"
                name={name}
                value={p.id}
                checked={checked.has(p.id)}
                onChange={(e) =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(p.id);
                    else next.delete(p.id);
                    return next;
                  })
                }
                className="h-4 w-4 accent-obsidian"
              />
              <span className="flex-1">{p.name}</span>
              <span className="font-mono text-xs text-ink-faint">{p.sku}</span>
              {p.status !== "ACTIVE" ? <span className="text-[10px] uppercase text-ink-faint">{p.status}</span> : null}
              {p.isDemo ? <span className="text-[10px] uppercase text-champagne-dark">Demo</span> : null}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
