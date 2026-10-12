import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/checkout", "/cart", "/account", "/order", "/*/checkout", "/*/cart", "/*/account", "/*/order"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
