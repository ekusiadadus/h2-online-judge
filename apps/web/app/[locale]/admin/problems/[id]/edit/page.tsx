"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ProblemForm } from "@/components/admin";
import type { Problem, Position } from "@/lib/h2lang/types";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

interface ProblemData extends Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  sampleCode: string;
  tags: { id: string; name: string; slug: string }[];
  isPublic: boolean;
  status: "draft" | "published";
  gridSize: number;
  maxSteps: number;
}

interface User {
  id: string;
  role: "user" | "admin";
}

/**
 * Admin problem edit page.
 */
export default function AdminEditProblemPage({ params }: PageProps) {
  const t = useTranslations("admin.problems");
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [problemId, setProblemId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setProblemId(id));
  }, [params]);

  // Check auth and fetch problem
  useEffect(() => {
    if (!problemId) return;

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

        // Fetch problem
        const problemRes = await fetch(`/api/problems/${problemId}`);
        if (!problemRes.ok) {
          setError("Problem not found");
          return;
        }
        const problemData = await problemRes.json();
        setProblem(problemData);
      } catch {
        setError("Failed to load problem");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [problemId, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!user || !problem) {
    return null;
  }

  // Convert tags array to string array for the form
  const tagNames = problem.tags?.map((tag) => tag.name) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t("edit.title", { defaultValue: "Edit Problem" })}
      </h1>
      <div className="rounded-lg border border-border bg-card p-6">
        <ProblemForm
          mode="edit"
          initialProblem={{
            id: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            sampleCode: problem.sampleCode || "",
            tags: tagNames,
            isPublic: problem.isPublic,
            status: problem.status,
            goals: problem.goals,
            walls: problem.walls,
            traps: problem.traps,
            startPosition: problem.startPosition,
          }}
        />
      </div>
    </div>
  );
}
