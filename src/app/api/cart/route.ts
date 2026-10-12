import { NextResponse, type NextRequest } from "next/server";
import { cartDetails } from "@/lib/cart";
import { LOCALES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "en";
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 100);
  const items = await cartDetails(ids, LOCALES.includes(locale as never) ? locale : "en");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return NextResponse.json({ items: items.map(({ sku, ...rest }) => rest) }, { headers: { "Cache-Control": "no-store" } });
}
