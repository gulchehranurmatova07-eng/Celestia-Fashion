import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serif, sans } from "../fonts";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "CELESTIA Admin", template: "%s · CELESTIA Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-white">
        {user.role !== "ADMIN" ? (
          <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="eyebrow text-ink-faint">403</p>
            <h1 className="font-serif text-4xl font-light">Access denied</h1>
            <p className="max-w-sm text-sm text-ink-soft">This area is restricted to store administrators.</p>
            <Link href="/" className="btn-outline">
              Return to the store
            </Link>
          </main>
        ) : (
          <AdminShell email={user.email}>{children}</AdminShell>
        )}
      </body>
    </html>
  );
}
