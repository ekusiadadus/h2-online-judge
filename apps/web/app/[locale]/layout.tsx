import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { routing } from "@/i18n/routing";
import { Header, Footer } from "@/components/layout";
import { UsernameGuard } from "@/components/auth";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";
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
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: `${baseUrl}/${locale}`,
      siteName: SITE_NAME,
      locale: getOGLocale(locale),
      alternateLocale: getAlternateOGLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.title"),
      description: t("home.description"),
    },
    robots: getRobotsConfig(),
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
