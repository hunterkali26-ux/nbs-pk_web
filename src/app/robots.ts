import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

/**
 * robots.txt generation.
 *
 * The admin dashboard and auth screens are private — they must not be crawled
 * or indexed. The sitemap pointer uses the canonical site URL so search
 * engines always resolve it against the deployed domain.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/login", "/signup", "/account", "/checkout", "/cart", "/search"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}