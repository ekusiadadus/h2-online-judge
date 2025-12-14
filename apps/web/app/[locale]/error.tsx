"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Error boundary for locale routes.
 * Catches errors in the locale segment and below.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-destructive mb-4">Error</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {t("error")}
        </h2>
        <p className="text-muted-foreground mb-8">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground/60 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
