import type { MetadataRoute } from "next";
import { getBaseUrl, SUPPORTED_LOCALES } from "@/lib/seo/metadata";

/**
 * Static pages to include in sitemap.
 * Each page will be generated for all supported locales.
 */
const STATIC_PAGES = ["", "/playground", "/problems"];

/**
 * Generate sitemap.xml with multilingual support.
 *
 * Features:
 * - All static pages with lastModified timestamps
 * - Alternate language URLs (hreflang) for each page
 * - x-default for language fallback
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Generate entries for each static page
  for (const page of STATIC_PAGES) {
    const pathSuffix = page === "" ? "" : page;

    // Create language alternates for hreflang
    const languages: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      languages[locale] = `${baseUrl}/${locale}${pathSuffix}`;
    }
    // Add x-default for language fallback
    languages["x-default"] = `${baseUrl}${pathSuffix}`;

    // Add entry for each locale
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${locale}${pathSuffix}`,
        lastModified,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
        alternates: {
          languages,
        },
      });
    }

    // Add x-default entry (points to default locale path without locale prefix)
    entries.push({
      url: `${baseUrl}${pathSuffix}`,
      lastModified,
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 1.0 : 0.8,
      alternates: {
        languages,
      },
    });
  }

  // TODO: Add dynamic problem pages
  // const problems = await fetchPublishedProblems();
  // for (const problem of problems) {
  //   entries.push({
  //     url: `${baseUrl}/problems/${problem.id}`,
  //     lastModified: problem.updatedAt,
  //     ...
  //   });
  // }

  return entries;
}
