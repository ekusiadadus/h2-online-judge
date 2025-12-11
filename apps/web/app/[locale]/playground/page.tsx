"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CodeEditor } from "@/components/playground/code-editor";
import { Grid } from "@/components/playground/grid";
import { ControlPanel } from "@/components/playground/control-panel";
import { OutputPanel } from "@/components/playground/output-panel";
import { ToolPalette, type ToolType } from "@/components/playground/tool-palette";
import { initH2Lang, compile, isInitialized } from "@/lib/h2lang";
import type { CompileResult, Program, Problem, Position } from "@/lib/h2lang/types";

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
export default function PlaygroundPage() {
  const t = useTranslations("playground");

  // WASM initialization state
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);

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

  // Problem editor state
  const [editMode, setEditMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>("goal");
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
          state.direction = (state.direction + 90) % 360;
        } else if (command.type === "rotate_left") {
          state.direction = (state.direction - 90 + 360) % 360;
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

    // Calculate interval based on speed (1x = 500ms, 2x = 250ms, 4x = 125ms)
    const intervalMs = 500 / speed;

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

  // Handle run
  const handleRun = useCallback(() => {
    // Exit edit mode when running
    setEditMode(false);

    let result = compileResult;

    // Compile if not already compiled or if there are errors
    if (!result || result.status !== "success") {
      result = handleCompile();
    }

    if (result?.status === "success") {
      setCurrentStep(0);
      setIsRunning(true);
    }
  }, [compileResult, handleCompile]);

  // Handle step
  const handleStep = useCallback(() => {
    // Exit edit mode when stepping
    setEditMode(false);

    // Stop auto-run if running
    setIsRunning(false);

    let result = compileResult;

    // Compile if not already compiled
    if (!result || result.status !== "success") {
      result = handleCompile();
      if (!result || result.status !== "success") {
        return;
      }
    }

    const program = result.program;
    if (currentStep < program.max_steps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [compileResult, currentStep, handleCompile]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
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
      {/* Control Panel and Tool Palette */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <ControlPanel
          onRun={handleRun}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          isRunning={isRunning}
          speed={speed}
        />
        <ToolPalette
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          editMode={editMode}
          onEditModeToggle={handleEditModeToggle}
        />
      </div>

      {/* Problem info bar */}
      {problem.goals.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Targets: <span className="font-medium text-foreground">{remainingGoals}</span> / {problem.goals.length}
          </span>
          {allGoalsVisited && (
            <span className="text-green-600 font-medium">
              ✓ All targets reached!
            </span>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grid Visualization */}
        <div className="flex flex-col">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("grid.title", { defaultValue: "Grid" })}
            {editMode && (
              <span className="ml-2 text-xs text-primary">
                (Edit Mode)
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
          />
        </div>

        {/* Code Editor */}
        <div className="flex flex-col">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("editor.title", { defaultValue: "Code" })}
            {!wasmReady && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Loading compiler...)
              </span>
            )}
          </h2>
          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder={t("editor.placeholder")}
            className="min-h-[632px]"
            disabled={!wasmReady}
          />
        </div>
      </div>

      {/* Output Panel */}
      <OutputPanel compileResult={compileResult} currentStep={currentStep} />
    </div>
  );
}
