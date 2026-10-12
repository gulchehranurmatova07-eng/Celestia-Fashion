import { formatPrice } from "@/lib/format";

export const money = (n: number) => formatPrice(n, "en");

export function dateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tashkent",
  }).format(new Date(d));
}

export function dateOnly(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Tashkent" }).format(new Date(d));
}

/** Value for <input type="date"> in Tashkent time. */
export function dateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date(d));
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "Cash on delivery",
  CLICK: "Click",
  PAYME: "Payme",
  UZUM: "Uzum",
};
