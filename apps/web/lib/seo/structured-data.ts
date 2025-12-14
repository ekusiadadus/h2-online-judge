/**
 * JSON-LD Structured Data Generators
 *
 * Functions to generate schema.org structured data for SEO.
 * Supports WebSite, WebApplication, Organization, and SoftwareSourceCode schemas.
 */

import { getBaseUrl, SITE_NAME } from "./metadata";

/** Base schema context */
const SCHEMA_CONTEXT = "https://schema.org";

/**
 * WebSite schema type
 */
interface WebSiteSchema {
  "@context": string;
  "@type": "WebSite";
  name: string;
  url: string;
  inLanguage: string[];
  potentialAction: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

/**
 * Generate WebSite schema for site-wide SEO.
 * Includes search action for enhanced search results.
 *
 * @param locale - Current locale
 * @returns WebSite JSON-LD schema
 */
export function generateWebSiteSchema(locale: string): WebSiteSchema {
  const baseUrl = getBaseUrl();

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: ["ja", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/problems?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * WebApplication schema type
 */
interface WebAppSchema {
  "@context": string;
  "@type": "WebApplication";
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  browserRequirements: string;
  availableLanguage: string[];
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
}

/**
 * Generate WebApplication schema for the H2 Online Judge app.
 *
 * @param locale - Current locale
 * @returns WebApplication JSON-LD schema
 */
export function generateWebAppSchema(locale: string): WebAppSchema {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and WebAssembly support",
    availableLanguage: ["ja", "en"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
  };
}

/**
 * Organization schema type
 */
interface OrganizationSchema {
  "@context": string;
  "@type": "Organization";
  name: string;
  url: string;
}

/**
 * Generate Organization schema.
 *
 * @returns Organization JSON-LD schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: "ekusiadadus",
    url: getBaseUrl(),
  };
}

/**
 * SoftwareSourceCode schema type
 */
interface SoftwareSourceCodeSchema {
  "@context": string;
  "@type": "SoftwareSourceCode";
  name: string;
  codeRepository: string;
  programmingLanguage: string;
  runtimePlatform: string;
}

/**
 * Generate SoftwareSourceCode schema for h2lang compiler.
 *
 * @returns SoftwareSourceCode JSON-LD schema
 */
export function generateSoftwareSourceCodeSchema(): SoftwareSourceCodeSchema {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareSourceCode",
    name: "h2lang",
    codeRepository: "https://github.com/ekusiadadus/h2lang",
    programmingLanguage: "Rust",
    runtimePlatform: "WebAssembly",
  };
}

/**
 * Combine multiple schemas into a single JSON-LD graph.
 *
 * @param schemas - Array of schema objects
 * @returns Combined JSON-LD with @graph
 */
export function combineSchemas(
  schemas: Record<string, unknown>[]
): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": schemas.map((schema) => {
      // Remove @context from individual schemas when combining
      const { "@context": _, ...rest } = schema;
      return rest;
    }),
  };
}
