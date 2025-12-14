import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/metadata";

/**
 * Generate robots.txt for search engine crawlers.
 *
 * - Allows crawling of all public pages
 * - Disallows API routes and admin pages
 * - Points to sitemap.xml for discovery
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
