import { AuthError } from "@/lib/auth";
import { exportSubscribers } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

function csvCell(v: string) {
  // Quote every cell and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  let rows;
  try {
    const status = new URL(req.url).searchParams.get("status") ?? undefined;
    rows = await exportSubscribers(status); // calls requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    throw err;
  }
  const header = ["email", "locale", "consent", "status", "source", "created_at"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.email, r.locale, r.consent ? "yes" : "no", r.status, r.source, r.createdAt.toISOString()].map(csvCell).join(","),
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="celestia-newsletter-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
