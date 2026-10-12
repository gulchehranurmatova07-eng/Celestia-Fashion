"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/admin/actions";
import { ToastProvider } from "./Toast";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/outbox", label: "Outbox" },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <ul className="space-y-0.5">
      {NAV.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`block border-l-2 px-4 py-2 text-2xs font-medium uppercase tracking-wide2 transition-colors ${
              isActive(item.href)
                ? "border-obsidian bg-ivory text-obsidian"
                : "border-transparent text-ink-soft hover:bg-ivory/60 hover:text-obsidian"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <ToastProvider>
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-line px-3 py-1.5 text-2xs uppercase tracking-wide2 lg:hidden"
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Close" : "Menu"}
            </button>
            <Link href="/admin" className="font-serif text-xl tracking-[0.18em]">
              CELESTIA <span className="font-sans text-2xs uppercase tracking-wide2 text-ink-faint">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden max-w-[220px] truncate text-ink-soft sm:inline" title="Signed in as">
              {email}
            </span>
            <Link href="/" className="underline-offset-4 hover:underline">
              View store
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="underline-offset-4 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {open ? (
          <nav id="admin-mobile-nav" aria-label="Admin" className="border-t border-line py-2 lg:hidden">
            {nav}
            <p className="px-4 pt-2 text-xs text-ink-faint sm:hidden">{email}</p>
          </nav>
        ) : null}
      </header>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-56 shrink-0 border-r border-line bg-white lg:block">
          <nav aria-label="Admin" className="sticky top-14 py-4">
            {nav}
          </nav>
        </aside>
        <main id="admin-main" className="min-w-0 flex-1 bg-[#FBFAF7] px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
