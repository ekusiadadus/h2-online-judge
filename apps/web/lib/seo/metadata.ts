/**
 * SEO Metadata Helpers
 *
 * Utility functions for generating SEO metadata across the application.
 * Supports multilingual URLs with proper hreflang configuration.
 */

/** Supported locales for the application */
export const SUPPORTED_LOCALES = ["ja", "en"] as const;

/** Default locale (Japanese) */
export const DEFAULT_LOCALE = "ja";

/** Site name used in metadata */
export const SITE_NAME = "H2 Online Judge";

/** Type for supported locales */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Get the base URL for the application.
 * Uses NEXT_PUBLIC_BASE_URL environment variable or falls back to default.
 */
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_BASE_URL ||
    "https://h2-online-judge.vercel.app"
  );
}

/**
 * Generate canonical URL for a given locale and path.
 *
 * @param locale - The locale code (ja, en)
 * @param path - The page path (e.g., "/playground", "problems")
 * @returns Full canonical URL
 */
export function getCanonicalUrl(locale: string, path: string): string {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathSuffix = path === "" ? "" : normalizedPath;

  return `${baseUrl}/${locale}${pathSuffix}`;
}

/**
 * Generate alternate language URLs for hreflang tags.
 * Includes x-default for language fallback.
 *
 * @param path - The page path (without locale prefix)
 * @returns Object with language codes as keys and URLs as values
 */
export function getAlternateLanguages(path: string): Record<string, string> {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : path ? `/${path}` : "";

  return {
    ja: `${baseUrl}/ja${normalizedPath}`,
    en: `${baseUrl}/en${normalizedPath}`,
    "x-default": `${baseUrl}${normalizedPath}`,
  };
}

/**
 * Check if the current environment is a Vercel preview deployment.
 */
export function isPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/**
 * Get robots configuration based on environment.
 * Returns noindex for preview deployments.
 */
export function getRobotsConfig(): { index: boolean; follow: boolean } {
  const isPreview = isPreviewEnvironment();

  return {
    index: !isPreview,
    follow: !isPreview,
  };
}

/**
 * Generate OpenGraph locale from locale code.
 */
export function getOGLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    ja: "ja_JP",
    en: "en_US",
  };

  return localeMap[locale] || "en_US";
}

/**
 * Get alternate OpenGraph locale.
 */
export function getAlternateOGLocale(locale: string): string {
  return locale === "ja" ? "en_US" : "ja_JP";
}
