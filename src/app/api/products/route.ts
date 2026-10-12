import { NextResponse, type NextRequest } from "next/server";
import { cardsByIds } from "@/lib/catalog";
import { LOCALES } from "@/lib/constants";

// Product cards by id — used for the guest wishlist and recently viewed items.
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "en";
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  const items = await cardsByIds(ids, LOCALES.includes(locale as never) ? locale : "en");
  return NextResponse.json({ items });
}
