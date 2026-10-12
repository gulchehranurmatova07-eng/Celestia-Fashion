"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { Dialog } from "@/components/ui/Dialog";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { Price } from "@/components/product/Price";
import type { ProductCard } from "@/lib/catalog";

type Result = { products: ProductCard[]; categories: { slug: string; name: string }[] };

export function SearchOverlay({ popular }: { popular: { label: string; href: string }[] }) {
  const t = useTranslations("common.search");
  const locale = useLocale();
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useStore();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 30);
  }, [searchOpen]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(null);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/search?locale=${locale}&q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Result) => setRes(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, locale]);

  const close = () => setSearchOpen(false);
  const term = q.trim();

  return (
    <Dialog open={searchOpen} onClose={close} label={t("label")} variant="top">
      <div className="container-luxe pb-10 pt-6">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!term) return;
            close();
            router.push(`/search?q=${encodeURIComponent(term)}`);
          }}
          className="flex items-center gap-3 border-b border-obsidian pb-3"
        >
          <SearchIcon />
          <label htmlFor="site-search" className="sr-only">{t("label")}</label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            className="flex-1 bg-transparent font-serif text-2xl font-light outline-none placeholder:text-ink-faint md:text-3xl"
          />
          <button type="button" onClick={close} aria-label={t("close")} className="p-2"><CloseIcon /></button>
        </form>

        <div className="mt-6 min-h-24" aria-live="polite">
          {term.length < 2 ? (
            <div>
              <p className="eyebrow mb-3 text-ink-faint">{t("popular")}</p>
              <ul className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} onClick={close} className="inline-block border border-line px-4 py-2 text-sm hover:border-obsidian">{p.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : loading && !res ? (
            <p className="text-sm text-ink-soft">{t("loading")}</p>
          ) : res && res.products.length === 0 && res.categories.length === 0 ? (
            <p className="text-sm text-ink-soft">{t("noResults", { q: term })}</p>
          ) : res ? (
            <div className="grid gap-8 md:grid-cols-[200px_1fr]">
              <div>
                {res.categories.length > 0 && (
                  <>
                    <p className="eyebrow mb-3 text-ink-faint">{t("categories")}</p>
                    <ul className="space-y-2">
                      {res.categories.map((c) => (
                        <li key={c.slug}><Link href={`/catalog?category=${c.slug}`} onClick={close} className="link-underline text-sm">{c.name}</Link></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3 text-ink-faint">{t("products")}</p>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {res.products.map((p) => (
                    <li key={p.id}>
                      <Link href={`/product/${p.slug}`} onClick={close} className="group block">
                        <div className="relative aspect-product overflow-hidden bg-[#141414]">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                        </div>
                        <p className="mt-2 text-xs leading-snug">{p.name}</p>
                        <Price price={p.price} compareAtPrice={p.compareAtPrice} locale={locale} className="text-xs text-ink-soft" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/search?q=${encodeURIComponent(term)}`} onClick={close} className="eyebrow link-underline mt-6 inline-block">
                  {t("viewAll", { q: term })}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
