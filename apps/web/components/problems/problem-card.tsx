"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  gridSize: number;
  createdAt: Date | string;
}

interface ProblemCardProps {
  problem: Problem;
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * Problem card component for displaying problem summary.
 */
export function ProblemCard({ problem }: ProblemCardProps) {
  const t = useTranslations("problems");

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {problem.title}
        </h3>
        <span
          className={cn(
            "px-2 py-1 rounded text-xs font-medium shrink-0",
            difficultyColors[problem.difficulty]
          )}
        >
          {t(`difficulty.${problem.difficulty}`)}
        </span>
      </div>

      {problem.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {problem.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Grid: {problem.gridSize}x{problem.gridSize}</span>
      </div>
    </Link>
  );
}
