import { CURRENCY, type Locale } from "./constants";

const INTL_LOCALE: Record<Locale, string> = { en: "en-US", ru: "ru-RU", uz: "uz-Latn-UZ" };

export function intlLocale(locale: string) {
  return INTL_LOCALE[locale as Locale] ?? "en-US";
}

// Formatting is done by hand (not Intl) so server and browser always render identical strings.
function group(amount: number, sep: string) {
  const sign = amount < 0 ? "-" : "";
  return sign + Math.round(Math.abs(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatPrice(amount: number, locale: string) {
  if (locale === "ru") return `${group(amount, "\u00A0")}\u00A0сум`;
  if (locale === "uz") return `${group(amount, "\u00A0")}\u00A0so\u2018m`;
  return `${CURRENCY}\u00A0${group(amount, ",")}`;
}

export function formatDate(date: Date | string, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Asia/Tashkent" }).format(
    new Date(date),
  );
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}
