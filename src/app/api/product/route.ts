import { NextResponse, type NextRequest } from "next/server";
import { getProductBySlug } from "@/lib/catalog";
import { LOCALES } from "@/lib/constants";

// Product detail for the quick-view dialog.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const locale = req.nextUrl.searchParams.get("locale") ?? "en";
  const product = await getProductBySlug(slug, LOCALES.includes(locale as never) ? locale : "en");
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ product });
}
