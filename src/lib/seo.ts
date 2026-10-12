import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./constants";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Absolute URL for a path in a locale ("as-needed" prefixing: English has no prefix). */
export function localizedUrl(path: string, locale: string) {
  const clean = path === "/" ? "" : path;
  return `${SITE_URL}${locale === DEFAULT_LOCALE ? "" : `/${locale}`}${clean}` || SITE_URL;
}

export function pageMetadata({
  title,
  description,
  path,
  locale,
  image,
  noindex,
}: {
  title: string;
  description?: string;
  path: string;
  locale: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, localizedUrl(path, l)]));
  return {
    title,
    description,
    alternates: { canonical: localizedUrl(path, locale), languages: { ...languages, "x-default": localizedUrl(path, DEFAULT_LOCALE) } },
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "CELESTIA",
      locale: ({ en: "en_US", ru: "ru_RU", uz: "uz_UZ" } as Record<Locale, string>)[locale as Locale],
      type: "website",
      images: [{ url: image ?? "/brand/og-default.jpg" }],
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
