"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CodeEditor } from "@/components/playground/code-editor";
import { Grid } from "@/components/playground/grid";
import { ControlPanel } from "@/components/playground/control-panel";
import { OutputPanel } from "@/components/playground/output-panel";
import { ToolPalette, type ToolType } from "@/components/playground/tool-palette";
import { SaveDraftModal } from "@/components/playground/save-draft-modal";
import { ShareButton } from "@/components/playground/share-button";
import { PresetSelector } from "@/components/playground/preset-selector";
import { Button } from "@/components/ui/button";
import { initH2Lang, compile, isInitialized } from "@/lib/h2lang";
import { decodeShareState } from "@/lib/share";
import { getByteCount } from "@/lib/utils/byte-count";
import type { Preset } from "@/lib/presets";
import type { CompileResult, Program, Problem, Position, Direction } from "@/lib/h2lang/types";

/** Grid size (Herbert Online Judge specification) */
const GRID_SIZE = 25;

/**
 * Check if a position exists in an array of positions.
 */
function hasPosition(positions: Position[], x: number, y: number): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

/**
 * Remove a position from an array of positions.
 */
function removePosition(positions: Position[], x: number, y: number): Position[] {
  return positions.filter((p) => !(p.x === x && p.y === y));
}

/**
 * Playground page for H2 language programming.
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │  Control Panel          │  Tool Palette     │
 * ├─────────────────────┬───────────────────────┤
 * │                     │                       │
 * │      Grid           │   Code Editor         │
 * │                     │                       │
 * ├─────────────────────┴───────────────────────┤
 * │  Output Panel                               │
 * └─────────────────────────────────────────────┘
 */
function PlaygroundContent() {
  const t = useTranslations("playground");
  const searchParams = useSearchParams();

  // WASM initialization state
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [shareLoaded, setShareLoaded] = useState(false);

  // Code state (single agent can omit "0:" prefix in h2lang v0.2.0+)
  const [code, setCode] = useState("srl");

  // Compilation state
  const [compileResult, setCompileResult] = useState<CompileResult | null>(
    null
  );

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showPath, setShowPath] = useState(false);

  // Problem editor state
  const [editMode, setEditMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>("goal");
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [problem, setProblem] = useState<Problem>({
    goals: [],
    walls: [],
    traps: [],
    startPosition: {
      x: Math.floor(GRID_SIZE / 2),
      y: Math.floor(GRID_SIZE / 2),
      direction: 0,
    },
  });

  // Ref for animation interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WASM on mount
  useEffect(() => {
    if (isInitialized()) {
      setWasmReady(true);
      return;
    }

    initH2Lang()
      .then(() => {
        setWasmReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize h2lang:", error);
        setWasmError(error.message);
      });
  }, []);

  // Load shared state from URL parameter
  useEffect(() => {
    if (shareLoaded) return;

    const shareCode = searchParams.get("s");
    if (!shareCode) {
      setShareLoaded(true);
      return;
    }

    const result = decodeShareState(shareCode);
    if (result.success) {
      setCode(result.state.code);
      if (result.state.problem) {
        setProblem(result.state.problem);
      }
    } else {
      console.error("Failed to decode share code:", result.error);
    }
    setShareLoaded(true);
  }, [searchParams, shareLoaded]);

  // Handle code compilation using real h2lang WASM
  const handleCompile = useCallback(() => {
    if (!wasmReady) {
      setCompileResult({
        status: "error",
        errors: [{ line: 0, column: 0, message: "Compiler not ready" }],
      });
      return null;
    }

    try {
      const result = compile(code);
      setCompileResult(result);
      setCurrentStep(0);
      return result;
    } catch (error) {
      const errorResult: CompileResult = {
        status: "error",
        errors: [
          {
            line: 0,
            column: 0,
            message: error instanceof Error ? error.message : "Compilation failed",
          },
        ],
      };
      setCompileResult(errorResult);
      return errorResult;
    }
  }, [code, wasmReady]);

  // Calculate visited goals based on agent path
  const visitedGoals = useMemo(() => {
    if (!compileResult || compileResult.status !== "success") {
      return [];
    }

    const program = compileResult.program;
    const startPos = problem.startPosition;
    const visited: Position[] = [];

    // Track agent positions through simulation
    const agentStates = program.agents.map(() => ({
      x: startPos.x,
      y: startPos.y,
      direction: startPos.direction,
    }));

    // Check if starting position is on a goal
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

          // Check bounds and walls
          if (
            nextX >= 0 && nextX < GRID_SIZE &&
            nextY >= 0 && nextY < GRID_SIZE &&
            !hasPosition(problem.walls, nextX, nextY)
          ) {
            state.x = nextX;
            state.y = nextY;

            // Check if stepped on trap (reset visited goals)
            if (hasPosition(problem.traps, state.x, state.y)) {
              visited.length = 0;
            }

            // Check if stepped on goal
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

  // Auto-run effect: advance steps when running
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

    // Calculate interval based on speed (1x = 300ms, 2x = 150ms, 4x = 75ms)
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

  // Auto-stop when all goals are visited
  useEffect(() => {
    if (isRunning && problem.goals.length > 0 && visitedGoals.length >= problem.goals.length) {
      setIsRunning(false);
    }
  }, [isRunning, visitedGoals.length, problem.goals.length]);

  // Handle run
  const handleRun = useCallback(() => {
    // Exit edit mode when running
    setEditMode(false);

    // If already compiled and not at the end, resume from current step
    if (
      compileResult?.status === "success" &&
      currentStep < compileResult.program.max_steps
    ) {
      setIsRunning(true);
      return;
    }

    // Otherwise, recompile and start from beginning
    const result = handleCompile();

    if (result?.status === "success") {
      setCurrentStep(0);
      setIsRunning(true);
    }
  }, [compileResult, currentStep, handleCompile]);

  // Handle step
  const handleStep = useCallback(() => {
    // Exit edit mode when stepping
    setEditMode(false);

    // Stop auto-run if running
    setIsRunning(false);

    // Always recompile to ensure we have the latest code
    const result = handleCompile();
    if (!result || result.status !== "success") {
      return;
    }

    const program = result.program;
    if (currentStep < program.max_steps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, handleCompile]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
  }, []);

  // Handle stop
  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Handle speed change
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // Handle edit mode toggle
  const handleEditModeToggle = useCallback(() => {
    if (!editMode) {
      // Stop simulation when entering edit mode
      setIsRunning(false);
    }
    setEditMode((prev) => !prev);
  }, [editMode]);

  // Handle tool selection
  const handleToolSelect = useCallback((tool: ToolType) => {
    setSelectedTool(tool);
  }, []);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: Preset) => {
    setCode(preset.sampleCode);
    setProblem(preset.problem);
    setCurrentStep(0);
    setCompileResult(null);
    setIsRunning(false);
    setEditMode(false);
  }, []);

  // Handle cell click in edit mode
  const handleCellClick = useCallback((x: number, y: number) => {
    setProblem((prev) => {
      const newProblem = { ...prev };

      // Check what's currently at this position
      const hasGoal = hasPosition(prev.goals, x, y);
      const hasWall = hasPosition(prev.walls, x, y);
      const hasTrap = hasPosition(prev.traps, x, y);
      const isStart = prev.startPosition.x === x && prev.startPosition.y === y;

      // Remove existing element at position (except start)
      const clearPosition = () => {
        newProblem.goals = removePosition(prev.goals, x, y);
        newProblem.walls = removePosition(prev.walls, x, y);
        newProblem.traps = removePosition(prev.traps, x, y);
      };

      switch (selectedTool) {
        case "goal":
          if (hasGoal) {
            // Toggle off
            newProblem.goals = removePosition(prev.goals, x, y);
          } else {
            clearPosition();
            newProblem.goals = [...newProblem.goals, { x, y }];
          }
          break;

        case "wall":
          if (hasWall) {
            // Toggle off
            newProblem.walls = removePosition(prev.walls, x, y);
          } else {
            clearPosition();
            newProblem.walls = [...newProblem.walls, { x, y }];
          }
          break;

        case "trap":
          if (hasTrap) {
            // Toggle off
            newProblem.traps = removePosition(prev.traps, x, y);
          } else {
            clearPosition();
            newProblem.traps = [...newProblem.traps, { x, y }];
          }
          break;

        case "start":
          // Move start position to clicked cell
          clearPosition();
          newProblem.startPosition = {
            x,
            y,
            direction: prev.startPosition.direction,
          };
          break;

        case "erase":
          clearPosition();
          break;
      }

      return newProblem;
    });
  }, [selectedTool]);

  // Get program if compilation was successful
  const program: Program | null =
    compileResult?.status === "success" ? compileResult.program : null;

  // Calculate remaining goals
  const remainingGoals = problem.goals.length - visitedGoals.length;
  const allGoalsVisited = problem.goals.length > 0 && remainingGoals === 0;

  // Show error if WASM failed to load
  if (wasmError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive">Failed to load compiler: {wasmError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Tool Palette, Save Draft, and Control Panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <ToolPalette
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            editMode={editMode}
            onEditModeToggle={handleEditModeToggle}
          />
          <PresetSelector onSelect={handlePresetSelect} />
          <ShareButton code={code} problem={problem} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDraftModal(true)}
          >
            {t("saveDraft.button")}
          </Button>
        </div>
        <ControlPanel
          onRun={handleRun}
          onStep={handleStep}
          onStop={handleStop}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          isRunning={isRunning}
          speed={speed}
          showPath={showPath}
          onShowPathChange={setShowPath}
        />
      </div>

      {/* Problem info bar */}
      {problem.goals.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-foreground">
            Targets: <span className="font-bold">{visitedGoals.length}</span> / {problem.goals.length}
          </span>
          {allGoalsVisited && (
            <span className="text-green-600 font-medium">
              ✓ All targets reached!
            </span>
          )}
        </div>
      )}

      {/* Main content area - 3 column layout with custom widths */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Grid Visualization */}
        <div className="flex flex-col lg:col-span-5">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("grid.title", { defaultValue: "Grid" })}
            {editMode && (
              <span className="ml-2 text-xs text-primary">
                {t("grid.editModeLabel", { defaultValue: "(Edit Mode)" })}
              </span>
            )}
          </h2>
          <Grid
            program={program}
            currentStep={currentStep}
            isRunning={isRunning}
            problem={problem}
            visitedGoals={visitedGoals}
            editMode={editMode}
            onCellClick={handleCellClick}
            showPath={showPath}
          />
        </div>

        {/* Code Editor */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("editor.title", { defaultValue: "Code" })}
              {!wasmReady && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Loading compiler...)
                </span>
              )}
            </h2>
            {/* Byte count display - CODE GOLF SCORE */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("editor.bytes", { defaultValue: "Bytes" })}:
                </span>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {getByteCount(code)}
                </span>
              </div>
            </div>
          </div>
          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder={t("editor.placeholder")}
            className="h-full min-h-[600px]"
            disabled={!wasmReady}
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col lg:col-span-2">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("output.title", { defaultValue: "Output" })}
          </h2>
          <OutputPanel
            compileResult={compileResult}
            currentStep={currentStep}
            className="h-full"
            visitedGoals={visitedGoals.length}
            totalGoals={problem.goals.length}
            byteCount={getByteCount(code)}
          />
        </div>
      </div>

      {/* Save Draft Modal */}
      <SaveDraftModal
        isOpen={showSaveDraftModal}
        onClose={() => setShowSaveDraftModal(false)}
        problem={problem}
        code={code}
      />
    </div>
  );
}

/**
 * Playground page wrapper with Suspense boundary.
 * Required for useSearchParams() to work during static generation.
 */
export default function PlaygroundPage() {
  return (
    <Suspense fallback={<PlaygroundLoading />}>
      <PlaygroundContent />
    </Suspense>
  );
}

/**
 * Loading fallback for the playground page.
 */
function PlaygroundLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
