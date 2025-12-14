import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * SEO Metadata Helper Tests
 *
 * Tests for the metadata helper functions used across the application.
 * Following TDD principles - tests written before implementation.
 */

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_BASE_URL: "https://h2-online-judge-web.vercel.app",
  VERCEL_ENV: "production",
};

vi.stubEnv("NEXT_PUBLIC_BASE_URL", mockEnv.NEXT_PUBLIC_BASE_URL);
vi.stubEnv("VERCEL_ENV", mockEnv.VERCEL_ENV);

describe("SEO Metadata Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBaseUrl", () => {
    it("returns NEXT_PUBLIC_BASE_URL when set", async () => {
      const { getBaseUrl } = await import("../../lib/seo/metadata");
      expect(getBaseUrl()).toBe("https://h2-online-judge-web.vercel.app");
    });

    it("returns fallback URL when env is not set", async () => {
      vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
      // Re-import to get fresh module
      vi.resetModules();
      const { getBaseUrl } = await import("../../lib/seo/metadata");
      expect(getBaseUrl()).toBe("https://h2-online-judge-web.vercel.app");
    });
  });

  describe("getCanonicalUrl", () => {
    it("generates correct canonical URL for root path", async () => {
      const { getCanonicalUrl } = await import("../../lib/seo/metadata");
      expect(getCanonicalUrl("ja", "")).toBe(
        "https://h2-online-judge-web.vercel.app/ja"
      );
    });

    it("generates correct canonical URL with path", async () => {
      const { getCanonicalUrl } = await import("../../lib/seo/metadata");
      expect(getCanonicalUrl("en", "/playground")).toBe(
        "https://h2-online-judge-web.vercel.app/en/playground"
      );
    });

    it("handles path without leading slash", async () => {
      const { getCanonicalUrl } = await import("../../lib/seo/metadata");
      expect(getCanonicalUrl("ja", "problems")).toBe(
        "https://h2-online-judge-web.vercel.app/ja/problems"
      );
    });
  });

  describe("getAlternateLanguages", () => {
    it("returns all language alternates including x-default", async () => {
      const { getAlternateLanguages } = await import("../../lib/seo/metadata");
      const alternates = getAlternateLanguages("/playground");

      expect(alternates).toHaveProperty("ja");
      expect(alternates).toHaveProperty("en");
      expect(alternates).toHaveProperty("x-default");
    });

    it("generates correct URLs for each language", async () => {
      const { getAlternateLanguages } = await import("../../lib/seo/metadata");
      const alternates = getAlternateLanguages("/playground");

      expect(alternates.ja).toBe(
        "https://h2-online-judge-web.vercel.app/ja/playground"
      );
      expect(alternates.en).toBe(
        "https://h2-online-judge-web.vercel.app/en/playground"
      );
      expect(alternates["x-default"]).toBe(
        "https://h2-online-judge-web.vercel.app/playground"
      );
    });

    it("handles root path correctly", async () => {
      const { getAlternateLanguages } = await import("../../lib/seo/metadata");
      const alternates = getAlternateLanguages("");

      expect(alternates.ja).toBe("https://h2-online-judge-web.vercel.app/ja");
      expect(alternates.en).toBe("https://h2-online-judge-web.vercel.app/en");
      expect(alternates["x-default"]).toBe(
        "https://h2-online-judge-web.vercel.app"
      );
    });
  });

  describe("isPreviewEnvironment", () => {
    it("returns false for production environment", async () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.resetModules();
      const { isPreviewEnvironment } = await import("../../lib/seo/metadata");
      expect(isPreviewEnvironment()).toBe(false);
    });

    it("returns true for preview environment", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.resetModules();
      const { isPreviewEnvironment } = await import("../../lib/seo/metadata");
      expect(isPreviewEnvironment()).toBe(true);
    });
  });

  describe("getRobotsConfig", () => {
    it("returns indexable config for production", async () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.resetModules();
      const { getRobotsConfig } = await import("../../lib/seo/metadata");
      const config = getRobotsConfig();

      expect(config.index).toBe(true);
      expect(config.follow).toBe(true);
    });

    it("returns noindex config for preview", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.resetModules();
      const { getRobotsConfig } = await import("../../lib/seo/metadata");
      const config = getRobotsConfig();

      expect(config.index).toBe(false);
      expect(config.follow).toBe(false);
    });
  });
});

describe("SEO Metadata Constants", () => {
  it("exports supported locales", async () => {
    const { SUPPORTED_LOCALES } = await import("../../lib/seo/metadata");
    expect(SUPPORTED_LOCALES).toContain("ja");
    expect(SUPPORTED_LOCALES).toContain("en");
  });

  it("exports default locale", async () => {
    const { DEFAULT_LOCALE } = await import("../../lib/seo/metadata");
    expect(DEFAULT_LOCALE).toBe("ja");
  });

  it("exports site name", async () => {
    const { SITE_NAME } = await import("../../lib/seo/metadata");
    expect(SITE_NAME).toBe("H2 Online Judge");
  });
});
