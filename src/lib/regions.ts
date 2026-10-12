export const UZ_REGIONS = [
  "TASHKENT_CITY", "TASHKENT_REGION", "ANDIJAN", "BUKHARA", "FERGANA", "JIZZAKH", "KASHKADARYA",
  "KHOREZM", "NAMANGAN", "NAVOI", "SAMARKAND", "SURKHANDARYA", "SYRDARYA", "KARAKALPAKSTAN",
] as const;
export type Region = (typeof UZ_REGIONS)[number];
// Countries we currently deliver to. Add ISO codes here (and region lists) to expand internationally.
export const COUNTRIES = ["UZ"] as const;
