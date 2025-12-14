import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaygroundClient } from "@/components/playground/playground-client";
import { getBaseUrl, getCanonicalUrl, getAlternateLanguages } from "@/lib/seo/metadata";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Generate metadata for the playground page.
 *
 * Uses /api/og endpoint for dynamic OG images that display the shared problem grid.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "seo" });

  const baseUrl = getBaseUrl();
  const shareCode = typeof resolvedSearchParams.s === "string" ? resolvedSearchParams.s : undefined;

  // Build OG image URL with share code if present
  const ogImageUrl = shareCode
    ? `${baseUrl}/api/og?s=${encodeURIComponent(shareCode)}`
    : `${baseUrl}/api/og`;

  return {
    title: t("playground.title"),
    description: t("playground.description"),
    alternates: {
      canonical: getCanonicalUrl(locale, "/playground"),
      languages: getAlternateLanguages("/playground"),
    },
    openGraph: {
      title: t("playground.title"),
      description: t("playground.description"),
      url: getCanonicalUrl(locale, "/playground"),
      siteName: "H2 Online Judge",
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t("playground.title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("playground.title"),
      description: t("playground.description"),
      images: [ogImageUrl],
    },
  };
}

/**
 * Playground page for H2 language programming.
 *
 * This is a server component that renders the client-side playground.
 * The playground allows users to write H2 code and visualize robot execution.
 */
export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
