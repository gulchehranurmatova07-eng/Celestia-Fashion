"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";

/** Navigates to basePath with updated query params, keeping the rest of the URL state. */
export function useFilterNav(basePath: string, query: Record<string, string>) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (changes: Record<string, string | null>, opts: { keepPage?: boolean } = {}) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!opts.keepPage) next.delete("page");
    const qs = next.toString();
    start(() => router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false }));
  };
  const toggleList = (key: string, value: string) => {
    const current = (query[key] ?? "").split(",").filter(Boolean);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    go({ [key]: next.join(",") || null });
  };
  return { go, toggleList, pending };
}
