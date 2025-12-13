"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  status: "draft" | "published";
  isPublic: boolean;
  gridSize: number;
  goals: { x: number; y: number }[];
  createdAt: string;
}

interface User {
  id: string;
  role: "user" | "admin";
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * Admin problems list page for managing drafts and published problems.
 */
export default function AdminProblemsPage() {
  const t = useTranslations("admin.problems.list");
  const tDifficulty = useTranslations("problems.difficulty");
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // Check auth and fetch problems
  useEffect(() => {
    async function init() {
      try {
        // Check user
        const userRes = await fetch("/api/users/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();
        if (userData.role !== "admin") {
          router.push("/");
          return;
        }
        setUser(userData);

        // Fetch all problems (admin sees all)
        const problemsRes = await fetch("/api/problems?limit=100");
        if (problemsRes.ok) {
          const data = await problemsRes.json();
          setProblems(data.data || []);
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published", isPublic: true }),
      });

      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "published", isPublic: true } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to publish:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/problems/new">{t("createNew")}</Link>
        </Button>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">{t("empty")}</p>
          <Button asChild>
            <Link href="/admin/problems/new">{t("createNew")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">
                      {problem.title}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        problem.status === "draft"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      )}
                    >
                      {problem.status === "draft"
                        ? t("draft")
                        : t("published")}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        difficultyColors[problem.difficulty]
                      )}
                    >
                      {tDifficulty(problem.difficulty)}
                    </span>
                  </div>
                  {problem.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {problem.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Goals: {problem.goals?.length || 0} | Grid:{" "}
                    {problem.gridSize}x{problem.gridSize}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {problem.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublish(problem.id)}
                    >
                      {t("publish")}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/problems/${problem.id}/edit`}>
                      {t("edit")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(problem.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
