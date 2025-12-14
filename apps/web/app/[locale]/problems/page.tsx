import { cache } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ProblemCard } from "@/components/problems";
import { db } from "@/db";
import { problems } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

type Props = {
  params: Promise<{ locale: string }>;
};

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  gridSize: number;
  createdAt: Date;
}

/**
 * Fetch published problems directly from database.
 * Uses React cache() for request deduplication.
 */
const getProblems = cache(async (): Promise<Problem[]> => {
  const results = await db.query.problems.findMany({
    where: and(eq(problems.isPublic, true), eq(problems.status, "published")),
    orderBy: [desc(problems.createdAt)],
    columns: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      gridSize: true,
      createdAt: true,
    },
  });

  return results;
});

export default async function ProblemsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const problems = await getProblems();

  return <ProblemsContent problems={problems} />;
}

function ProblemsContent({ problems }: { problems: Problem[] }) {
  const t = useTranslations("problems");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
}
