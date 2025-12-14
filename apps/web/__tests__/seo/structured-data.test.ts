import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * JSON-LD Structured Data Tests
 *
 * Tests for the structured data generators used for SEO.
 * Following TDD principles - tests written before implementation.
 */

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://h2-online-judge.vercel.app");

describe("Structured Data Generators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateWebSiteSchema", () => {
    it("returns valid WebSite schema structure", async () => {
      const { generateWebSiteSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebSiteSchema("ja");

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("WebSite");
      expect(schema.name).toBe("H2 Online Judge");
      expect(schema.url).toBeDefined();
    });

    it("includes search action for site search", async () => {
      const { generateWebSiteSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebSiteSchema("ja");

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction["@type"]).toBe("SearchAction");
      expect(schema.potentialAction.target).toBeDefined();
    });

    it("includes inLanguage with both locales", async () => {
      const { generateWebSiteSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebSiteSchema("ja");

      expect(schema.inLanguage).toContain("ja");
      expect(schema.inLanguage).toContain("en");
    });
  });

  describe("generateWebAppSchema", () => {
    it("returns valid WebApplication schema structure", async () => {
      const { generateWebAppSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebAppSchema("en");

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("WebApplication");
      expect(schema.name).toBe("H2 Online Judge");
    });

    it("includes application category as Educational", async () => {
      const { generateWebAppSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebAppSchema("ja");

      expect(schema.applicationCategory).toBe("EducationalApplication");
    });

    it("includes browser requirements for WASM", async () => {
      const { generateWebAppSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebAppSchema("ja");

      expect(schema.browserRequirements).toContain("WebAssembly");
    });

    it("includes free offer information", async () => {
      const { generateWebAppSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebAppSchema("ja");

      expect(schema.offers).toBeDefined();
      expect(schema.offers["@type"]).toBe("Offer");
      expect(schema.offers.price).toBe("0");
    });

    it("includes available languages", async () => {
      const { generateWebAppSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateWebAppSchema("ja");

      expect(schema.availableLanguage).toContain("ja");
      expect(schema.availableLanguage).toContain("en");
    });
  });

  describe("generateOrganizationSchema", () => {
    it("returns valid Organization schema structure", async () => {
      const { generateOrganizationSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateOrganizationSchema();

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Organization");
      expect(schema.name).toBeDefined();
    });

    it("includes URL", async () => {
      const { generateOrganizationSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateOrganizationSchema();

      expect(schema.url).toBe("https://h2-online-judge.vercel.app");
    });
  });

  describe("generateSoftwareSourceCodeSchema", () => {
    it("returns valid SoftwareSourceCode schema for h2lang", async () => {
      const { generateSoftwareSourceCodeSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateSoftwareSourceCodeSchema();

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("SoftwareSourceCode");
      expect(schema.name).toBe("h2lang");
    });

    it("includes code repository URL", async () => {
      const { generateSoftwareSourceCodeSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateSoftwareSourceCodeSchema();

      expect(schema.codeRepository).toContain("github.com");
    });

    it("includes programming language as Rust", async () => {
      const { generateSoftwareSourceCodeSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateSoftwareSourceCodeSchema();

      expect(schema.programmingLanguage).toBe("Rust");
    });

    it("includes runtime platform as WebAssembly", async () => {
      const { generateSoftwareSourceCodeSchema } = await import(
        "../../lib/seo/structured-data"
      );
      const schema = generateSoftwareSourceCodeSchema();

      expect(schema.runtimePlatform).toBe("WebAssembly");
    });
  });
});

describe("JSON-LD Validation", () => {
  it("all schemas are valid JSON", async () => {
    const {
      generateWebSiteSchema,
      generateWebAppSchema,
      generateOrganizationSchema,
      generateSoftwareSourceCodeSchema,
    } = await import("../../lib/seo/structured-data");

    const schemas = [
      generateWebSiteSchema("ja"),
      generateWebAppSchema("ja"),
      generateOrganizationSchema(),
      generateSoftwareSourceCodeSchema(),
    ];

    for (const schema of schemas) {
      expect(() => JSON.stringify(schema)).not.toThrow();
    }
  });

  it("all schemas have required @context and @type", async () => {
    const {
      generateWebSiteSchema,
      generateWebAppSchema,
      generateOrganizationSchema,
      generateSoftwareSourceCodeSchema,
    } = await import("../../lib/seo/structured-data");

    const schemas = [
      generateWebSiteSchema("ja"),
      generateWebAppSchema("ja"),
      generateOrganizationSchema(),
      generateSoftwareSourceCodeSchema(),
    ];

    for (const schema of schemas) {
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBeDefined();
    }
  });
});
