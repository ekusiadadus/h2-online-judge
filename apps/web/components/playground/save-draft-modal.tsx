"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/lib/h2lang/types";

interface SaveDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem;
  code: string;
}

interface User {
  id: string;
  role: "user" | "admin";
}

/**
 * Modal for saving the current playground state as a draft problem.
 */
export function SaveDraftModal({
  isOpen,
  onClose,
  problem,
  code,
}: SaveDraftModalProps) {
  const t = useTranslations("playground.saveDraft");
  const tDifficulty = useTranslations("problems.difficulty");
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is logged in and is admin
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      checkUser();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          difficulty,
          isPublic: false,
          status: "draft",
          gridSize: 25,
          startPosition: problem.startPosition,
          goals: problem.goals,
          walls: problem.walls,
          traps: problem.traps,
          sampleCode: code,
          maxSteps: 1000,
          tags: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error"));
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/admin/problems");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : !user || user.role !== "admin" ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">{t("loginRequired")}</p>
            <Button asChild>
              <a href="/auth/login">Login</a>
            </Button>
          </div>
        ) : success ? (
          <div className="py-8 text-center">
            <p className="text-green-600 font-medium">{t("success")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded border border-red-500 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("titleLabel")} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("descriptionLabel")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-y"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("difficultyLabel")}
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "easy" | "medium" | "hard")
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="easy">{tDifficulty("easy")}</option>
                <option value="medium">{tDifficulty("medium")}</option>
                <option value="hard">{tDifficulty("hard")}</option>
              </select>
            </div>

            <div className="rounded bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Problem Info:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>Goals: {problem.goals.length}</li>
                <li>Walls: {problem.walls.length}</li>
                <li>Traps: {problem.traps.length}</li>
                <li>
                  Start: ({problem.startPosition.x}, {problem.startPosition.y})
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={saving || !title.trim()}
              >
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
