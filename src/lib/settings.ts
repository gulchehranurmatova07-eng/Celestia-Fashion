import "server-only";
import { cache } from "react";
import { db } from "./db";
import type { Locale } from "./constants";

type Localized = Record<Locale, string>;

export type StoreSettings = {
  announcement: { enabled: boolean; text: Localized; href: string };
  hero: {
    title: Localized;
    subtitle: Localized;
    imageDesktop: string[]; // triptych on large screens
    imageMobile: string;
  };
  shipping: {
    courierTashkent: number;
    courierRegions: number;
    freeThreshold: number; // 0 disables free delivery
    pickupEnabled: boolean;
    pickupAddress: Localized;
  };
  payments: { cod: boolean; click: boolean; payme: boolean; uzum: boolean };
  contact: { email: string; phone: string; address: Localized; hours: Localized };
  social: { instagram: string; telegram: string; facebook: string };
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: {
    enabled: true,
    text: {
      en: "Discover the new season — complimentary delivery on orders over 1,500,000 UZS",
      ru: "Откройте новый сезон — бесплатная доставка при заказе от 1 500 000 сум",
      uz: "Yangi mavsumni kashf eting — 1 500 000 so‘mdan ortiq buyurtmalarga bepul yetkazib berish",
    },
    href: "/catalog?new=1",
  },
  hero: {
    title: {
      en: "Style Defines Your Story.",
      ru: "Стиль рассказывает вашу историю.",
      uz: "Uslub — sizning hikoyangiz.",
    },
    subtitle: {
      en: "Discover a world where craftsmanship meets contemporary elegance.",
      ru: "Откройте мир, где мастерство встречается с современной элегантностью.",
      uz: "Mahorat zamonaviy nafosat bilan uchrashadigan olamni kashf eting.",
    },
    imageDesktop: ["/images/looks/look-4.jpg", "/images/editorial/hero-seated.jpg", "/images/looks/look-14.jpg"],
    imageMobile: "/images/editorial/hero-seated.jpg",
  },
  shipping: {
    courierTashkent: 35000,
    courierRegions: 60000,
    freeThreshold: 1500000,
    pickupEnabled: false,
    pickupAddress: { en: "", ru: "", uz: "" },
  },
  // Cash on delivery is a business decision; card providers additionally need credentials in .env.
  payments: { cod: true, click: false, payme: false, uzum: false },
  contact: {
    email: "care@celestia.example",
    phone: "+998 00 000 00 00",
    address: { en: "Tashkent, Uzbekistan", ru: "Ташкент, Узбекистан", uz: "Toshkent, O‘zbekiston" },
    hours: { en: "Mon–Sat, 10:00–20:00", ru: "Пн–Сб, 10:00–20:00", uz: "Du–Sha, 10:00–20:00" },
  },
  social: { instagram: "", telegram: "", facebook: "" },
};

function merge<T>(base: T, override: unknown): T {
  if (Array.isArray(base) || typeof base !== "object" || base === null) {
    return (override === undefined ? base : override) as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  if (override && typeof override === "object") {
    for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
      out[k] = k in out ? merge(out[k], v) : v;
    }
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const row = await db.setting.findUnique({ where: { key: "store" } });
  if (!row) return DEFAULT_SETTINGS;
  try {
    return merge(DEFAULT_SETTINGS, JSON.parse(row.value));
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export async function saveSettings(settings: StoreSettings) {
  const value = JSON.stringify(settings);
  await db.setting.upsert({ where: { key: "store" }, update: { value }, create: { key: "store", value } });
}
