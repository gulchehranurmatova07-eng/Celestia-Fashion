import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/catalog";
import { LOCALES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  const locale = req.nextUrl.searchParams.get("locale") ?? "en";
  const data = await searchSuggestions(q, LOCALES.includes(locale as never) ? locale : "en");
  return NextResponse.json(data);
}
