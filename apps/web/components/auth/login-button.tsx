"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
}

/**
 * Login button that redirects to Auth0 login page.
 */
export function LoginButton({
  className,
  variant = "default",
  size = "sm",
}: LoginButtonProps) {
  const t = useTranslations("auth");

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href="/auth/login">{t("login")}</a>
    </Button>
  );
}
