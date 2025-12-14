"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/playground/grid";
import { CodeEditor } from "@/components/playground/code-editor";
import { cn } from "@/lib/utils";
import { initH2Lang, compile, isInitialized, countBytes } from "@/lib/h2lang";
import type { CompileResult, Program, Problem, Position, Direction } from "@/lib/h2lang/types";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

interface ProblemData {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  gridSize: number;
  startPosition: { x: number; y: number; direction: number };
  goals: Position[];
  walls: Position[];
  traps: Position[];
  sampleCode: string;
  maxSteps: number;
  authorId: string;
}

interface LeaderboardEntry {
  rank: number;
  stepCount: number;
  codeLength: number;
  userName: string;
  date: string;
}

interface LeaderboardData {
  problemId: string;
  totalSubmissions: number;
  uniqueUsers: number;
  leaderboard: LeaderboardEntry[];
}

interface User {
  id: string;
  username?: string | null;
  name?: string | null;
  role: "user" | "admin";
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * Check if a position exists in an array of positions.
 */
function hasPosition(positions: Position[], x: number, y: number): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

/**
 * Problem solving page with grid visualization, code editor, and leaderboard.
 */
export default function ProblemSolvePage({ params }: PageProps) {
  const t = useTranslations("problems");
  const tPlayground = useTranslations("playground");

  // Params state
  const [problemId, setProblemId] = useState<string | null>(null);

  // Data fetching state
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WASM state
  const [wasmReady, setWasmReady] = useState(false);

  // Code and simulation state
  const [code, setCode] = useState("");
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(2);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: "accepted" | "wrong_answer" | "error";
    stepCount?: number;
  } | null>(null);

  // Ref for animation interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate effective byte count using WASM (code golf scoring)
  const effectiveBytes = useMemo(() => {
    if (!wasmReady) return null;
    try {
      const result = countBytes(code);
      if (result.status === "success") {
        return result.bytes;
      }
      return null;
    } catch {
      return null;
    }
  }, [code, wasmReady]);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setProblemId(id));
  }, [params]);

  // Initialize WASM
  useEffect(() => {
    if (isInitialized()) {
      setWasmReady(true);
      return;
    }
    initH2Lang()
      .then(() => setWasmReady(true))
      .catch((err) => console.error("Failed to init h2lang:", err));
  }, []);

  // Fetch problem, leaderboard, and user
  useEffect(() => {
    if (!problemId) return;

    async function fetchData() {
      try {
        // Fetch problem
        const problemRes = await fetch(`/api/problems/${problemId}`);
        if (!problemRes.ok) {
          setError("Problem not found");
          setLoading(false);
          return;
        }
        const problemData = await problemRes.json();
        setProblem(problemData);
        setCode(problemData.sampleCode || "");

        // Fetch leaderboard
        const leaderboardRes = await fetch(`/api/problems/${problemId}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }

        // Fetch user (optional)
        try {
          const userRes = await fetch("/api/users/me");
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          }
        } catch {
          // Not logged in
        }
      } catch {
        setError("Failed to load problem");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [problemId]);

  // Create Problem object for Grid component
  const gridProblem: Problem | undefined = problem
    ? {
        goals: problem.goals,
        walls: problem.walls,
        traps: problem.traps,
        startPosition: {
          x: problem.startPosition.x,
          y: problem.startPosition.y,
          direction: problem.startPosition.direction as Direction,
        },
      }
    : undefined;

  // Calculate visited goals based on simulation
  const visitedGoals = useMemo(() => {
    if (!compileResult || compileResult.status !== "success" || !problem) {
      return [];
    }

    const program = compileResult.program;
    const startPos = problem.startPosition;
    const visited: Position[] = [];

    const agentStates = program.agents.map(() => ({
      x: startPos.x,
      y: startPos.y,
      direction: startPos.direction,
    }));

    // Check starting position
    for (const goal of problem.goals) {
      if (goal.x === startPos.x && goal.y === startPos.y) {
        if (!hasPosition(visited, goal.x, goal.y)) {
          visited.push({ x: goal.x, y: goal.y });
        }
      }
    }

    // Simulate up to current step
    for (let step = 0; step < currentStep && step < program.timeline.length; step++) {
      const timelineEntry = program.timeline[step];
      if (!timelineEntry) continue;
      for (const agentCommand of timelineEntry.agent_commands) {
        const state = agentStates[agentCommand.agent_id];
        if (!state) continue;

        const command = agentCommand.command;
        if (command.type === "straight") {
          const dx = Math.round(Math.sin((state.direction * Math.PI) / 180));
          const dy = -Math.round(Math.cos((state.direction * Math.PI) / 180));
          const nextX = state.x + dx;
          const nextY = state.y + dy;

          if (
            nextX >= 0 && nextX < 25 &&
            nextY >= 0 && nextY < 25 &&
            !hasPosition(problem.walls, nextX, nextY)
          ) {
            state.x = nextX;
            state.y = nextY;

            if (hasPosition(problem.traps, state.x, state.y)) {
              visited.length = 0;
            }

            for (const goal of problem.goals) {
              if (goal.x === state.x && goal.y === state.y) {
                if (!hasPosition(visited, goal.x, goal.y)) {
                  visited.push({ x: goal.x, y: goal.y });
                }
              }
            }
          }
        } else if (command.type === "rotate_right") {
          state.direction = ((state.direction + 90) % 360) as Direction;
        } else if (command.type === "rotate_left") {
          state.direction = ((state.direction - 90 + 360) % 360) as Direction;
        }
      }
    }

    return visited;
  }, [compileResult, currentStep, problem]);

  // Check if all goals are visited
  const allGoalsVisited = problem && visitedGoals.length >= problem.goals.length;

  // Handle compile
  const handleCompile = useCallback(() => {
    if (!wasmReady) return null;
    try {
      const result = compile(code);
      setCompileResult(result);
      setCurrentStep(0);
      return result;
    } catch (err) {
      const errorResult: CompileResult = {
        status: "error",
        errors: [{ line: 0, column: 0, message: String(err) }],
      };
      setCompileResult(errorResult);
      return errorResult;
    }
  }, [code, wasmReady]);

  // Auto-run effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const program = compileResult?.status === "success" ? compileResult.program : null;
    if (!program) {
      setIsRunning(false);
      return;
    }

    const intervalMs = 300 / speed;
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= program.max_steps) {
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, compileResult, speed]);

  // Auto-stop when all goals visited
  useEffect(() => {
    if (isRunning && allGoalsVisited) {
      setIsRunning(false);
    }
  }, [isRunning, allGoalsVisited]);

  // Handle run
  const handleRun = useCallback(() => {
    const result = handleCompile();
    if (result?.status === "success") {
      setCurrentStep(0);
      setIsRunning(true);
      setSubmitResult(null);
    }
  }, [handleCompile]);

  // Handle step
  const handleStep = useCallback(() => {
    setIsRunning(false);
    const result = handleCompile();
    if (result?.status === "success") {
      setCurrentStep((prev) => Math.min(prev + 1, result.program.max_steps));
    }
  }, [handleCompile]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
    setSubmitResult(null);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!user || !problem) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // First compile and run to completion
      const result = handleCompile();
      if (!result || result.status !== "success") {
        setSubmitResult({ status: "error" });
        setSubmitting(false);
        return;
      }

      // Simulate to check if all goals are reached
      const program = result.program;
      const startPos = problem.startPosition;
      const visited: Position[] = [];
      let finalStep = 0;

      const agentStates = program.agents.map(() => ({
        x: startPos.x,
        y: startPos.y,
        direction: startPos.direction,
      }));

      // Check starting position
      for (const goal of problem.goals) {
        if (goal.x === startPos.x && goal.y === startPos.y) {
          if (!hasPosition(visited, goal.x, goal.y)) {
            visited.push({ x: goal.x, y: goal.y });
          }
        }
      }

      // Simulate all steps
      for (let step = 0; step < program.timeline.length; step++) {
        finalStep = step + 1;
        const timelineEntry = program.timeline[step];
        if (!timelineEntry) continue;

        for (const agentCommand of timelineEntry.agent_commands) {
          const state = agentStates[agentCommand.agent_id];
          if (!state) continue;

          const command = agentCommand.command;
          if (command.type === "straight") {
            const dx = Math.round(Math.sin((state.direction * Math.PI) / 180));
            const dy = -Math.round(Math.cos((state.direction * Math.PI) / 180));
            const nextX = state.x + dx;
            const nextY = state.y + dy;

            if (
              nextX >= 0 && nextX < 25 &&
              nextY >= 0 && nextY < 25 &&
              !hasPosition(problem.walls, nextX, nextY)
            ) {
              state.x = nextX;
              state.y = nextY;

              if (hasPosition(problem.traps, state.x, state.y)) {
                visited.length = 0;
              }

              for (const goal of problem.goals) {
                if (goal.x === state.x && goal.y === state.y) {
                  if (!hasPosition(visited, goal.x, goal.y)) {
                    visited.push({ x: goal.x, y: goal.y });
                  }
                }
              }
            }
          } else if (command.type === "rotate_right") {
            state.direction = ((state.direction + 90) % 360) as Direction;
          } else if (command.type === "rotate_left") {
            state.direction = ((state.direction - 90 + 360) % 360) as Direction;
          }
        }

        // Check if all goals reached
        if (visited.length >= problem.goals.length) {
          break;
        }
      }

      const success = visited.length >= problem.goals.length;

      // Submit to server
      const res = await fetch(`/api/problems/${problem.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          result: {
            success,
            stepCount: finalStep,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitResult({
          status: data.status,
          stepCount: data.stepCount,
        });

        // Refresh leaderboard
        const leaderboardRes = await fetch(`/api/problems/${problem.id}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }
      } else {
        setSubmitResult({ status: "error" });
      }
    } catch {
      setSubmitResult({ status: "error" });
    } finally {
      setSubmitting(false);
    }
  }, [user, problem, code, handleCompile]);

  // Get program for Grid
  const program: Program | null =
    compileResult?.status === "success" ? compileResult.program : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive">{error || "Problem not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/problems"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("detail.back")}
          </Link>
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              difficultyColors[problem.difficulty]
            )}
          >
            {t(`difficulty.${problem.difficulty}`)}
          </span>
        </div>
        {!user && (
          <div className="text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-primary hover:underline">
              {t("solve.loginToSubmit")}
            </Link>
          </div>
        )}
      </div>

      {/* Main content - 3 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Grid */}
        <div className="lg:col-span-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <Grid
              program={program}
              currentStep={currentStep}
              isRunning={isRunning}
              problem={gridProblem}
              visitedGoals={visitedGoals}
              showPath={true}
            />
            {/* Progress info */}
            <div className="mt-2 text-sm text-center">
              <span>
                Targets: <strong>{visitedGoals.length}</strong> / {problem.goals.length}
              </span>
              {allGoalsVisited && (
                <span className="ml-2 text-green-600 font-medium">
                  Complete!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Code Editor + Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Code Editor */}
          <div className="flex-1">
            <CodeEditor
              value={code}
              onChange={setCode}
              placeholder={tPlayground("editor.placeholder")}
              className="h-[400px]"
              disabled={!wasmReady}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRun} disabled={!wasmReady || isRunning}>
              {tPlayground("controls.run")}
            </Button>
            <Button variant="outline" onClick={handleStep} disabled={!wasmReady}>
              {tPlayground("controls.step")}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {tPlayground("controls.reset")}
            </Button>
            {user && !user.username ? (
              <Link
                href="/setup-username"
                className="ml-auto inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                {t("solve.setUsernameFirst")}
              </Link>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!user || submitting}
                className="ml-auto bg-green-600 hover:bg-green-700"
              >
                {submitting ? t("solve.submitting") : t("solve.submit")}
              </Button>
            )}
          </div>

          {/* Submit result */}
          {submitResult && (
            <div className="text-sm">
              {submitResult.status === "accepted" ? (
                <>
                  <strong className="text-green-600 dark:text-green-400">{t("solve.accepted")}</strong>
                  {submitResult.stepCount && (
                    <span className="ml-2 text-muted-foreground">
                      Steps: {submitResult.stepCount}, Bytes: {effectiveBytes ?? "-"}
                    </span>
                  )}
                </>
              ) : (
                <strong className="text-destructive">{t("solve.wrongAnswer")}</strong>
              )}
            </div>
          )}

          {/* Compile errors */}
          {compileResult?.status === "error" && (
            <div className="text-sm text-destructive">
              <strong>{tPlayground("output.error")}</strong>
              <ul className="mt-1 list-disc list-inside">
                {compileResult.errors?.map((err, i) => (
                  <li key={i}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Ranking */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-border bg-card">
            <div className="p-3 border-b border-border">
              <h2 className="font-semibold">{t("solve.ranking")}</h2>
              {leaderboard && (
                <p className="text-xs text-muted-foreground">
                  {leaderboard.uniqueUsers} users solved
                </p>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {leaderboard && leaderboard.leaderboard.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-right">Steps</th>
                      <th className="px-2 py-1 text-right">Bytes</th>
                      <th className="px-2 py-1 text-left">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.leaderboard.map((entry, i) => (
                      <tr
                        key={i}
                        className="border-t border-border hover:bg-muted/50"
                      >
                        <td className="px-2 py-1">{entry.rank}</td>
                        <td className="px-2 py-1 text-right">{entry.stepCount}</td>
                        <td className="px-2 py-1 text-right">{entry.codeLength}</td>
                        <td className="px-2 py-1 truncate max-w-[100px]">
                          {entry.userName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {t("solve.noSubmissions")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {problem.description && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold mb-2">{t("detail.description")}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {problem.description}
          </p>
        </div>
      )}
    </div>
  );
}
