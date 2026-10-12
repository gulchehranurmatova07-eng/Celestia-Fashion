"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useStore } from "@/components/providers/StoreProvider";
import { Logo } from "@/components/brand/Logo";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export type NavCategory = { slug: string; name: string; children: { slug: string; name: string }[] };
export type NavCollection = { slug: string; name: string; image: string | null };

export function Header({
  categories,
  collections,
  signedIn,
}: {
  categories: NavCategory[];
  collections: NavCollection[];
  signedIn: boolean;
}) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { count, setCartOpen, setSearchOpen, wishlist } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState<null | "men" | "collections">(null);

  const overHero = pathname === "/" || /^\/collections\/[^/]+$/.test(pathname);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMega(null), [pathname]);

  const transparent = overHero && !scrolled && !mega;

  const links = [
    { href: "/catalog?new=1", label: t("nav.newArrivals") },
    { href: "/catalog?gender=women", label: t("nav.women") },
    { href: "/catalog?gender=men", label: t("nav.men"), mega: "men" as const },
    { href: "/catalog?category=accessories", label: t("nav.accessories") },
    { href: "/collections", label: t("nav.collections"), mega: "collections" as const },
    { href: "/catalog?sale=1", label: t("nav.sale") },
  ];

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 h-[var(--header-h)] transition-colors duration-500 ease-luxe",
          transparent ? "on-dark bg-transparent text-ivory" : "border-b border-line bg-white/95 text-ink backdrop-blur-sm",
        )}
        onMouseLeave={() => setMega(null)}
      >
        <div className="container-luxe grid h-full grid-cols-[1fr_auto_1fr] items-center lg:grid-cols-[auto_1fr_auto]">
          {/* Mobile: menu + search */}
          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t("nav.openMenu")} className="-ml-2 p-2">
              <MenuIcon />
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label={t("header.search")} className="p-2">
              <SearchIcon />
            </button>
          </div>

          <Link href="/" aria-label={`CELESTIA — ${t("nav.home")}`} className="justify-self-center lg:justify-self-start">
            <Logo />
          </Link>

          <nav aria-label={t("nav.mainNavigation")} className="hidden justify-center lg:flex">
            <ul className="flex items-center gap-7 xl:gap-9">
              {links.map((l) => (
                <li key={l.href} onMouseEnter={() => setMega(l.mega ?? null)} onFocus={() => setMega(l.mega ?? null)}>
                  <Link
                    href={l.href}
                    className="link-underline py-2 text-[11px] font-medium uppercase tracking-wide2"
                    aria-expanded={l.mega ? mega === l.mega : undefined}
                    aria-haspopup={l.mega ? "true" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
            <LanguageSwitcher signedIn={signedIn} className="mr-2 hidden sm:flex" />
            <button type="button" onClick={() => setSearchOpen(true)} aria-label={t("header.search")} className="hidden p-2 lg:inline-flex">
              <SearchIcon />
            </button>
            <Link href={signedIn ? "/account" : "/login"} aria-label={t("header.account")} className="hidden p-2 sm:inline-flex">
              <UserIcon />
            </Link>
            <Link href="/wishlist" aria-label={`${t("header.wishlist")} (${wishlist.length})`} className="relative p-2">
              <HeartIcon />
              {wishlist.length > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
            </Link>
            <button type="button" onClick={() => setCartOpen(true)} aria-label={t("header.bagCount", { count })} className="relative -mr-2 p-2">
              <BagIcon />
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                  transparent ? "bg-ivory text-obsidian" : "bg-obsidian text-ivory",
                  count === 0 && "opacity-0",
                )}
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {/* Mega panels (desktop) */}
        {mega && (
          <div className="absolute inset-x-0 top-full hidden border-b border-line bg-white text-ink shadow-[0_24px_40px_-32px_rgba(0,0,0,0.35)] animate-fade-in lg:block">
            <div className="container-luxe grid grid-cols-[1fr_auto] gap-10 py-10">
              {mega === "men" ? (
                <div className="grid grid-cols-3 gap-10">
                  {categories.map((c) => (
                    <div key={c.slug}>
                      <Link href={`/catalog?gender=men&category=${c.slug}`} className="eyebrow mb-4 block hover:underline">
                        {c.name}
                      </Link>
                      <ul className="space-y-2.5">
                        {c.children.map((ch) => (
                          <li key={ch.slug}>
                            <Link href={`/catalog?gender=men&category=${ch.slug}`} className="link-underline text-sm text-ink-soft hover:text-ink">
                              {ch.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-x-10 gap-y-3 self-start">
                  {collections.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/collections/${c.slug}`} className="font-serif text-2xl font-light hover:italic">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li className="col-span-2 pt-3">
                    <Link href="/collections" className="eyebrow link-underline">{t("nav.viewAll")}</Link>
                  </li>
                </ul>
              )}
              <div className="relative h-56 w-44 overflow-hidden bg-[#141414]">
                <Image
                  src={mega === "men" ? "/images/looks/look-6.jpg" : collections[0]?.image ?? "/images/looks/look-3.jpg"}
                  alt=""
                  fill
                  sizes="176px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        )}
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} collections={collections} signedIn={signedIn} />
    </>
  );
}
