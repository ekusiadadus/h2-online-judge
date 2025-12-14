"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "same";

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: "user" | "admin";
  createdAt: string;
}

/**
 * Profile page - shows user info and allows username editing.
 */
export default function ProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Username editing state
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login");
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const data = await res.json();
        setUser(data);
        setNewUsername(data.username || "");
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Debounced availability check
  useEffect(() => {
    if (!isEditing) return;

    if (!newUsername || newUsername.length < 3) {
      setStatus("idle");
      setErrorMessage("");
      return;
    }

    const normalizedUsername = newUsername.toLowerCase().trim();

    // Check if same as current
    if (user?.username && normalizedUsername === user.username) {
      setStatus("same");
      setErrorMessage("");
      return;
    }

    // Basic client-side validation
    if (!/^[a-z][a-z0-9_]*$/.test(normalizedUsername)) {
      setStatus("invalid");
      setErrorMessage(t("invalidFormat"));
      return;
    }

    if (normalizedUsername.includes("__")) {
      setStatus("invalid");
      setErrorMessage(t("invalidFormat"));
      return;
    }

    if (normalizedUsername.length > 20) {
      setStatus("invalid");
      setErrorMessage(t("invalidFormat"));
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
  }, [newUsername, isEditing, user?.username, t]);

  const handleSave = useCallback(async () => {
    if (status !== "available" || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/users/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser((prev) =>
          prev ? { ...prev, username: data.username } : prev
        );
        setIsEditing(false);
        setStatus("idle");
      } else {
        setErrorMessage(data.error || t("updateError"));
        setStatus("taken");
      }
    } catch {
      setErrorMessage(t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [newUsername, status, isSubmitting, t]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setNewUsername(user?.username || "");
    setStatus("idle");
    setErrorMessage("");
  }, [user?.username]);

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
      case "same":
        return (
          <svg
            className="h-5 w-5 text-muted-foreground"
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
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive">{error || "User not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="space-y-6">
        {/* Username Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("username")}</h2>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {t("edit")}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  className={cn(
                    "w-full pl-8 pr-10 py-2 border rounded-lg bg-background",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    status === "available" && "border-green-500",
                    (status === "taken" || status === "invalid") &&
                      "border-destructive"
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
              <div className="text-sm">
                {status === "checking" && (
                  <span className="text-muted-foreground">{t("checking")}</span>
                )}
                {status === "available" && (
                  <span className="text-green-600">{t("available")}</span>
                )}
                {status === "same" && (
                  <span className="text-muted-foreground">{t("sameUsername")}</span>
                )}
                {(status === "taken" || status === "invalid") && errorMessage && (
                  <span className="text-destructive">{errorMessage}</span>
                )}
                {status === "idle" && newUsername.length > 0 && newUsername.length < 3 && (
                  <span className="text-muted-foreground">{t("requirements")}</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">{t("requirements")}</p>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={status !== "available" || isSubmitting}
                >
                  {isSubmitting ? t("saving") : t("save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-lg">
              {user.username ? (
                <span className="font-mono">@{user.username}</span>
              ) : (
                <span className="text-muted-foreground italic">{t("notSet")}</span>
              )}
            </p>
          )}
        </div>

        {/* Email Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("email")}</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        {/* Display Name Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("displayName")}</h2>
          <p className="text-muted-foreground">{user.name || t("notSet")}</p>
        </div>

        {/* Account Info Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("accountInfo")}</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("role")}</dt>
              <dd className="font-medium capitalize">{user.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("createdAt")}</dt>
              <dd className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
