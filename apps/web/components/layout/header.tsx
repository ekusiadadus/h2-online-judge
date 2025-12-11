"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Header component with navigation and language switcher.
 */
export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/playground", label: t("playground") },
    { href: "/problems", label: t("problems") },
    { href: "/about", label: t("about") },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Herbert</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center space-x-6" role="navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => switchLocale("ja")}
            className={cn(
              "px-2 py-1 text-sm font-medium rounded transition-colors",
              locale === "ja"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="日本語に切り替え"
          >
            JA
          </button>
          <button
            onClick={() => switchLocale("en")}
            className={cn(
              "px-2 py-1 text-sm font-medium rounded transition-colors",
              locale === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Switch to English"
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
