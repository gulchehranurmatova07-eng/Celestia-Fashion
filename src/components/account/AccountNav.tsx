"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { logoutAction } from "@/app/actions/auth";

export function AccountNav() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  const items = [
    { href: "/account", label: t("overview") },
    { href: "/account/orders", label: t("orders") },
    { href: "/account/addresses", label: t("addresses") },
    { href: "/account/profile", label: t("profile") },
    { href: "/wishlist", label: t("wishlist") },
  ];
  return (
    <nav aria-label={t("overview")} className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 md:mx-0 md:flex-col md:gap-0 md:border-0 md:px-0">
      {items.map((i) => {
        const active = i.href === "/account" ? pathname === "/account" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={clsx("shrink-0 py-3 text-2xs font-medium uppercase tracking-wide2 md:border-b md:border-line md:py-4", active ? "text-ink" : "text-ink-faint hover:text-ink")}>
            {i.label}
          </Link>
        );
      })}
      <form action={logoutAction} className="shrink-0">
        <button type="submit" className="py-3 text-2xs font-medium uppercase tracking-wide2 text-ink-faint hover:text-ink md:py-4">{t("signOut")}</button>
      </form>
    </nav>
  );
}
