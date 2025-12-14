import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { routing } from "@/i18n/routing";
import { Header, Footer } from "@/components/layout";
import { UsernameGuard } from "@/components/auth";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import {
  getBaseUrl,
  getAlternateLanguages,
  getRobotsConfig,
  getOGLocale,
  getAlternateOGLocale,
  SITE_NAME,
} from "@/lib/seo/metadata";
import {
  generateWebSiteSchema,
  generateWebAppSchema,
} from "@/lib/seo/structured-data";
import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

/**
 * Generate metadata for the locale layout.
 * Includes metadataBase, OpenGraph, Twitter, and robots configuration.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const baseUrl = getBaseUrl();
  const alternates = getAlternateLanguages("");

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t("home.title"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("home.description"),
    keywords: [
      "Herbert",
      "H2",
      "code golf",
      "programming",
      "online judge",
      "competitive programming",
    ],
    authors: [{ name: "ekusiadadus" }],
    creator: "ekusiadadus",
    publisher: "H2 Online Judge",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: alternates,
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      other: [
        { rel: "icon", url: "/h2-logo-192.png", sizes: "192x192" },
        { rel: "icon", url: "/h2-logo-512.png", sizes: "512x512" },
      ],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: `${baseUrl}/${locale}`,
      siteName: SITE_NAME,
      locale: getOGLocale(locale),
      alternateLocale: getAlternateOGLocale(locale),
      type: "website",
      images: [
        {
          url: "/h2-logo-og.png",
          width: 1200,
          height: 630,
          alt: "H2 Online Judge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.title"),
      description: t("home.description"),
      images: ["/h2-logo-og.png"],
      creator: "@ekusiadadus",
    },
    robots: getRobotsConfig(),
    other: {
      "theme-color": "#00d4ff",
      "msapplication-TileColor": "#0a0f18",
    },
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client side
  const messages = await getMessages();

  // Generate structured data for SEO
  const webSiteSchema = generateWebSiteSchema(locale);
  const webAppSchema = generateWebAppSchema(locale);

  return (
    <html lang={locale}>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webAppSchema),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}
      >
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <WebVitalsReporter />
          <UsernameGuard />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
