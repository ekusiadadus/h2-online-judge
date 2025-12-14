"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { encodeShareState } from "@/lib/share";
import type { Problem } from "@/lib/h2lang/types";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  code: string;
  problem: Problem;
  className?: string;
}

/**
 * Share button component that generates a shareable URL
 * and copies it to the clipboard.
 */
export function ShareButton({ code, problem, className }: ShareButtonProps) {
  const t = useTranslations("playground");
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      // Encode the current state
      const encoded = encodeShareState({
        code,
        problem,
      });

      // Build the share URL
      const baseUrl = window.location.origin;
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      // Check if first part is a valid locale (ja or en)
      const validLocales = ["ja", "en"];
      const firstPart = pathParts[0] ?? "";
      const locale = validLocales.includes(firstPart) ? firstPart : "ja";
      const shareUrl = `${baseUrl}/${locale}/playground?s=${encoded}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // Show success state
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to share:", error);
    }
  }, [code, problem]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn(
        copied && "bg-green-100 text-green-800 border-green-300",
        className
      )}
    >
      {copied ? t("share.copied") : t("share.button")}
    </Button>
  );
}
