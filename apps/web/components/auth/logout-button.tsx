"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg";
}

/**
 * Logout button that redirects to Auth0 logout.
 */
export function LogoutButton({
  className,
  variant = "ghost",
  size = "sm",
}: LogoutButtonProps) {
  const t = useTranslations("auth");

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href="/auth/logout">{t("logout")}</a>
    </Button>
  );
}
