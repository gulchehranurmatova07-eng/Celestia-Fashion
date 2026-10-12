import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "@/lib/constants";

// Messages are split into namespaces (messages/<locale>/<namespace>.json).
const NAMESPACES = ["common", "home", "catalog", "product", "cart", "checkout", "account", "pages"] as const;

export async function loadMessages(locale: Locale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale | undefined;
  if (!locale || !routing.locales.includes(locale)) locale = routing.defaultLocale;
  return { locale, messages: await loadMessages(locale), timeZone: "Asia/Tashkent" };
});
