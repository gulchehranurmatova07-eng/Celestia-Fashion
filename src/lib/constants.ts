export const LOCALES = ["en", "ru", "uz"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const CURRENCY = "UZS";

export const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;
export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED"] as const;
export const SIZE_CHARTS = ["tops", "tailoring", "trousers", "shoes", "none"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Display order for sizes across the catalogue (unknown sizes sort last, alphabetically).
export const SIZE_ORDER = [
  "XS", "S", "M", "L", "XL", "XXL",
  "44", "46", "48", "50", "52", "54", "56",
  "28", "29", "30", "31", "32", "33", "34", "36", "38",
  "39", "40", "41", "42", "43", "45",
  "85", "90", "95", "100", "105",
  "OS",
];

export function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 3;
