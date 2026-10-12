"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Dialog } from "@/components/ui/Dialog";
import { Logo } from "@/components/brand/Logo";
import { ChevronDown, CloseIcon } from "@/components/ui/Icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavCategory, NavCollection } from "./Header";

export function MobileMenu({
  open,
  onClose,
  categories,
  collections,
  signedIn,
}: {
  open: boolean;
  onClose: () => void;
  categories: NavCategory[];
  collections: NavCollection[];
  signedIn: boolean;
}) {
  const t = useTranslations("common");
  const item = "flex w-full items-center justify-between border-b border-line py-4 font-serif text-[1.6rem] font-light";
  return (
    <Dialog open={open} onClose={onClose} label={t("nav.menu")} variant="left">
      <div className="flex h-full flex-col">
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
          <Logo />
          <button type="button" onClick={onClose} aria-label={t("nav.closeMenu")} className="-mr-2 p-2">
            <CloseIcon />
          </button>
        </div>
        <nav aria-label={t("nav.mainNavigation")} className="flex-1 overflow-y-auto px-5 pb-8" onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}>
          <Link href="/catalog?new=1" className={item}>{t("nav.newArrivals")}</Link>
          <Link href="/catalog?gender=women" className={item}>{t("nav.women")}</Link>
          <details className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-serif text-[1.6rem] font-light [&::-webkit-details-marker]:hidden">
              {t("nav.men")}
              <ChevronDown className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 pb-5 pl-1">
              <li><Link href="/catalog?gender=men" className="eyebrow">{t("nav.shopAll")}</Link></li>
              {categories.flatMap((c) => [
                <li key={c.slug} className="pt-2"><Link href={`/catalog?gender=men&category=${c.slug}`} className="text-sm font-medium">{c.name}</Link></li>,
                ...c.children.map((ch) => (
                  <li key={ch.slug} className="pl-3"><Link href={`/catalog?gender=men&category=${ch.slug}`} className="text-sm text-ink-soft">{ch.name}</Link></li>
                )),
              ])}
            </ul>
          </details>
          <Link href="/catalog?category=accessories" className={item}>{t("nav.accessories")}</Link>
          <details className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-serif text-[1.6rem] font-light [&::-webkit-details-marker]:hidden">
              {t("nav.collections")}
              <ChevronDown className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 pb-5 pl-1">
              {collections.map((c) => (
                <li key={c.slug}><Link href={`/collections/${c.slug}`} className="text-sm text-ink-soft">{c.name}</Link></li>
              ))}
              <li><Link href="/collections" className="eyebrow">{t("nav.viewAll")}</Link></li>
            </ul>
          </details>
          <Link href="/catalog?sale=1" className={item}>{t("nav.sale")}</Link>

          <div className="mt-8 space-y-4 text-sm">
            <Link href={signedIn ? "/account" : "/login"} className="block">{t("header.account")}</Link>
            <Link href="/wishlist" className="block">{t("header.wishlist")}</Link>
            <Link href="/contact" className="block">{t("footer.contactUs")}</Link>
          </div>
        </nav>
        <div className="border-t border-line px-5 py-4">
          <LanguageSwitcher signedIn={signedIn} />
        </div>
      </div>
    </Dialog>
  );
}
