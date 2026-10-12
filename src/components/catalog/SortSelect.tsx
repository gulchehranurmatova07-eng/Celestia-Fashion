"use client";

import { useTranslations } from "next-intl";
import { SORTS } from "@/lib/catalog-shared";
import { useFilterNav } from "./useFilterNav";

export function SortSelect({ basePath, query }: { basePath: string; query: Record<string, string> }) {
  const t = useTranslations("catalog");
  const { go, pending } = useFilterNav(basePath, query);
  return (
    <label className="flex items-center gap-2 text-2xs font-medium uppercase tracking-wide2">
      <span className="hidden sm:inline">{t("sort")}</span>
      <select
        value={query.sort ?? "recommended"}
        onChange={(e) => go({ sort: e.target.value === "recommended" ? null : e.target.value })}
        aria-busy={pending}
        className="h-11 cursor-pointer border border-line bg-white px-3 text-xs normal-case tracking-normal focus:border-obsidian focus:outline-none"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>{t(`sorts.${s}`)}</option>
        ))}
      </select>
    </label>
  );
}
