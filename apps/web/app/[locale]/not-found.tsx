import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Not found page for locale routes.
 * Displayed when a page is not found (404).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  const t = useTranslations("nav");

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("home")}
          </Link>
          <Link
            href="/playground"
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            {t("playground")}
          </Link>
          <Link
            href="/problems"
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            {t("problems")}
          </Link>
        </div>
      </div>
    </div>
  );
}
