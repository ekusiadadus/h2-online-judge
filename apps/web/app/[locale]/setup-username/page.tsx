"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

/**
 * Username setup page - shown to new users who haven't set their username yet.
 * Username must be unique and cannot be changed once set.
 */
export default function SetupUsernamePage() {
  const t = useTranslations("auth.setupUsername");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setStatus("idle");
      setErrorMessage("");
      return;
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Basic client-side validation
    if (!/^[a-z][a-z0-9_]*$/.test(normalizedUsername)) {
      setStatus("invalid");
      setErrorMessage(t("invalid"));
      return;
    }

    if (normalizedUsername.includes("__")) {
      setStatus("invalid");
      setErrorMessage(t("invalid"));
      return;
    }

    if (normalizedUsername.length > 20) {
      setStatus("invalid");
      setErrorMessage(t("invalid"));
      return;
    }

    setStatus("checking");
    setErrorMessage("");

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/username?username=${encodeURIComponent(normalizedUsername)}`
        );
        const data = await res.json();

        if (data.available) {
          setStatus("available");
          setErrorMessage("");
        } else {
          setStatus("taken");
          setErrorMessage(data.reason || t("taken"));
        }
      } catch {
        setStatus("invalid");
        setErrorMessage("Failed to check availability");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, t]);

  const handleSubmit = useCallback(async () => {
    if (status !== "available" || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/users/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        setErrorMessage(data.error || t("error"));
        setStatus("taken");
      }
    } catch {
      setErrorMessage(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [username, status, isSubmitting, router, t]);

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
        return (
          <svg
            className="animate-spin h-5 w-5 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case "available":
        return (
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "taken":
      case "invalid":
        return (
          <svg
            className="h-5 w-5 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">{t("success")}</h1>
          <p className="text-muted-foreground">
            @{username.toLowerCase().trim()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="space-y-4">
          {/* Username input */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={t("placeholder")}
                className={cn(
                  "w-full pl-8 pr-10 py-2 border rounded-lg bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  status === "available" && "border-green-500",
                  (status === "taken" || status === "invalid") && "border-destructive"
                )}
                maxLength={20}
                autoFocus
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </span>
            </div>

            {/* Status message */}
            <div className="mt-2 text-sm">
              {status === "checking" && (
                <span className="text-muted-foreground">{t("checking")}</span>
              )}
              {status === "available" && (
                <span className="text-green-600">{t("available")}</span>
              )}
              {(status === "taken" || status === "invalid") && errorMessage && (
                <span className="text-destructive">{errorMessage}</span>
              )}
              {status === "idle" && username.length > 0 && username.length < 3 && (
                <span className="text-muted-foreground">
                  {t("requirements")}
                </span>
              )}
            </div>
          </div>

          {/* Requirements */}
          <p className="text-xs text-muted-foreground">{t("requirements")}</p>

          {/* Warning */}
          <p className="text-xs text-amber-600 dark:text-amber-500">
            {t("cannotChange")}
          </p>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={status !== "available" || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
