"use client";

import { useTranslations } from "next-intl";

/**
 * Footer component with copyright information.
 */
export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer
      className="border-t border-border bg-background py-6"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>{t("copyright")}</p>
      </div>
    </footer>
  );
}
