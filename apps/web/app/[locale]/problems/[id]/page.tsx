import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  gridSize: number;
  startPosition: { x: number; y: number; direction: number };
  goals: { x: number; y: number }[];
  walls: { x: number; y: number }[];
  traps: { x: number; y: number }[];
  sampleCode: string;
  maxSteps: number;
  createdAt: string;
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

async function getProblem(id: string): Promise<Problem | null> {
  try {
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:4000";
    const res = await fetch(`${baseUrl}/api/problems/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProblemDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const problem = await getProblem(id);

  if (!problem) {
    notFound();
  }

  return <ProblemDetailContent problem={problem} />;
}

function ProblemDetailContent({ problem }: { problem: Problem }) {
  const t = useTranslations("problems");

  // Build playground URL with problem data
  const playgroundParams = new URLSearchParams({
    gridSize: problem.gridSize.toString(),
    startX: problem.startPosition.x.toString(),
    startY: problem.startPosition.y.toString(),
    startDir: problem.startPosition.direction.toString(),
    goals: JSON.stringify(problem.goals),
    walls: JSON.stringify(problem.walls),
    traps: JSON.stringify(problem.traps),
    code: problem.sampleCode || "",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/problems"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t("detail.back")}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-foreground">{problem.title}</h1>
        <span
          className={cn(
            "px-3 py-1 rounded text-sm font-medium shrink-0",
            difficultyColors[problem.difficulty]
          )}
        >
          {t(`difficulty.${problem.difficulty}`)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("detail.description")}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {problem.description ? (
                <p className="whitespace-pre-wrap">{problem.description}</p>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </div>
          </section>

          {problem.sampleCode && (
            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t("detail.sampleCode")}
              </h2>
              <pre className="rounded bg-muted p-4 overflow-x-auto text-sm font-mono">
                {problem.sampleCode}
              </pre>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Problem Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Grid Size</dt>
                <dd>
                  {problem.gridSize}x{problem.gridSize}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max Steps</dt>
                <dd>{problem.maxSteps}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Goals</dt>
                <dd>{problem.goals.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Walls</dt>
                <dd>{problem.walls.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Traps</dt>
                <dd>{problem.traps.length}</dd>
              </div>
            </dl>
          </div>

          <Link
            href={`/playground?${playgroundParams.toString()}`}
            className="flex items-center justify-center w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t("detail.tryIt")}
          </Link>
        </div>
      </div>
    </div>
  );
}
