"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Program, Problem, Position, Direction } from "@/lib/h2lang/types";

interface GridProps {
  program: Program | null;
  currentStep: number;
  isRunning: boolean;
  gridSize?: number;
  className?: string;
  /** Problem definition with goals, walls, traps */
  problem?: Problem;
  /** List of goals that have been visited */
  visitedGoals?: Position[];
  /** Enable edit mode for placing elements */
  editMode?: boolean;
  /** Callback when a cell is clicked in edit mode */
  onCellClick?: (x: number, y: number) => void;
  /** Show path trail for agents */
  showPath?: boolean;
}

interface AgentState {
  id: number;
  x: number;
  y: number;
  direction: number; // 0: up, 90: right, 180: down, 270: left
}

/** Herbert Online Judge specification: 25x25 grid */
const GRID_SIZE = 25;
/** Cell size in pixels (25 * 24 = 600px total) */
const CELL_SIZE = 24;

/**
 * Check if a position is in a list of positions.
 */
function hasPosition(positions: Position[], x: number, y: number): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

/**
 * Grid visualization component for H2 robot simulation.
 *
 * Displays a grid with agents moving according to the compiled program.
 * Supports Herbert-style problems with goals, walls, and traps.
 */
export function Grid({
  program,
  currentStep,
  isRunning,
  gridSize = GRID_SIZE,
  className,
  problem,
  visitedGoals = [],
  editMode = false,
  onCellClick,
  showPath = false,
}: GridProps) {
  // Get start position from problem or default to center
  const startPosition = problem?.startPosition ?? {
    x: Math.floor(gridSize / 2),
    y: Math.floor(gridSize / 2),
    direction: 0,
  };

  // Get walls for collision detection
  const walls = problem?.walls ?? [];

  // Calculate agent states and path history based on program and current step
  const { agentStates, pathHistory } = useMemo(() => {
    if (!program) {
      return {
        agentStates: [{
          id: 0,
          x: startPosition.x,
          y: startPosition.y,
          direction: startPosition.direction,
        }],
        pathHistory: [[{ x: startPosition.x, y: startPosition.y }]],
      };
    }

    // Initialize agents at start position
    const states: AgentState[] = program.agents.map((agent) => ({
      id: agent.id,
      x: startPosition.x,
      y: startPosition.y,
      direction: startPosition.direction,
    }));

    // Initialize path history for each agent
    const paths: Position[][] = program.agents.map(() => [
      { x: startPosition.x, y: startPosition.y },
    ]);

    // Apply commands up to current step
    for (let step = 0; step < currentStep && step < program.timeline.length; step++) {
      const timelineEntry = program.timeline[step];
      if (!timelineEntry) continue;
      for (const agentCommand of timelineEntry.agent_commands) {
        const stateIndex = states.findIndex((s) => s.id === agentCommand.agent_id);
        const state = states[stateIndex];
        if (!state) continue;

        const command = agentCommand.command;
        if (command.type === "straight") {
          // Calculate next position
          const dx = Math.round(Math.sin((state.direction * Math.PI) / 180));
          const dy = -Math.round(Math.cos((state.direction * Math.PI) / 180));
          const nextX = state.x + dx;
          const nextY = state.y + dy;

          // Check bounds
          if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
            continue; // Cannot move outside grid
          }

          // Check wall collision
          if (hasPosition(walls, nextX, nextY)) {
            continue; // Cannot move into wall
          }

          // Move forward
          state.x = nextX;
          state.y = nextY;

          // Record path
          paths[stateIndex]?.push({ x: nextX, y: nextY });
        } else if (command.type === "rotate_right") {
          state.direction = ((state.direction + 90) % 360) as Direction;
        } else if (command.type === "rotate_left") {
          state.direction = ((state.direction - 90 + 360) % 360) as Direction;
        }
      }
    }

    return { agentStates: states, pathHistory: paths };
  }, [program, currentStep, gridSize, startPosition, walls]);

  // Get agent color class
  const getAgentColor = (id: number) => {
    const colors = [
      "bg-agent-0",
      "bg-agent-1",
      "bg-agent-2",
      "bg-agent-3",
      "bg-agent-4",
      "bg-agent-5",
      "bg-agent-6",
      "bg-agent-7",
      "bg-agent-8",
      "bg-agent-9",
    ];
    return colors[id % colors.length];
  };

  // Get stroke color for path SVG
  const getPathStrokeColor = (id: number) => {
    const colors = [
      "#3b82f6", // blue
      "#ef4444", // red
      "#22c55e", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
      "#f97316", // orange
      "#6366f1", // indigo
      "#84cc16", // lime
    ];
    return colors[id % colors.length];
  };

  // Get rotation style for agent
  const getRotationStyle = (direction: number) => ({
    transform: `rotate(${direction}deg)`,
  });

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (editMode && onCellClick) {
      onCellClick(x, y);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div
        className="relative mx-auto"
        style={{
          width: gridSize * CELL_SIZE,
          height: gridSize * CELL_SIZE,
        }}
        role="img"
        aria-label="Robot grid"
      >
        {/* Grid cells */}
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          return (
            <div
              key={`${x}-${y}`}
              data-testid="grid-cell"
              className={cn(
                "absolute border border-grid-line bg-background",
                editMode && "cursor-pointer hover:bg-muted"
              )}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
              onClick={() => handleCellClick(x, y)}
            />
          );
        })}

        {/* Path trails (SVG) */}
        {showPath && pathHistory.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={gridSize * CELL_SIZE}
            height={gridSize * CELL_SIZE}
            style={{ zIndex: 5 }}
          >
            {pathHistory.map((path, agentIndex) => {
              if (path.length < 2) return null;
              const pathD = path
                .map((pos, i) => {
                  const cx = pos.x * CELL_SIZE + CELL_SIZE / 2;
                  const cy = pos.y * CELL_SIZE + CELL_SIZE / 2;
                  return i === 0 ? `M ${cx} ${cy}` : `L ${cx} ${cy}`;
                })
                .join(" ");
              return (
                <path
                  key={`path-${agentIndex}`}
                  d={pathD}
                  fill="none"
                  stroke={getPathStrokeColor(agentIndex)}
                  strokeWidth={3}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>
        )}

        {/* Walls (black blocks) */}
        {problem?.walls.map((wall, index) => (
          <div
            key={`wall-${index}`}
            data-testid="wall"
            className="absolute"
            style={{
              left: wall.x * CELL_SIZE + 2,
              top: wall.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              zIndex: 10,
              backgroundColor: "#1f2937",
            }}
          />
        ))}

        {/* Traps (gray circles) */}
        {problem?.traps.map((trap, index) => (
          <div
            key={`trap-${index}`}
            data-testid="trap"
            className="absolute rounded-full"
            style={{
              left: trap.x * CELL_SIZE + 4,
              top: trap.y * CELL_SIZE + 4,
              width: CELL_SIZE - 8,
              height: CELL_SIZE - 8,
              zIndex: 10,
              backgroundColor: "#9ca3af",
            }}
          />
        ))}

        {/* Goals (white/green circles) */}
        {problem?.goals.map((goal, index) => {
          const isVisited = hasPosition(visitedGoals, goal.x, goal.y);
          return (
            <div
              key={`goal-${index}`}
              data-testid={isVisited ? "goal-visited" : "goal"}
              className={cn(
                "absolute rounded-full border-2",
                isVisited
                  ? "bg-green-500 border-green-600"
                  : "bg-white border-gray-300"
              )}
              style={{
                left: goal.x * CELL_SIZE + 5,
                top: goal.y * CELL_SIZE + 5,
                width: CELL_SIZE - 10,
                height: CELL_SIZE - 10,
                zIndex: 15,
              }}
            />
          );
        })}

        {/* Agents */}
        {agentStates.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "absolute flex items-center justify-center transition-all duration-150",
              getAgentColor(agent.id)
            )}
            style={{
              left: agent.x * CELL_SIZE + 3,
              top: agent.y * CELL_SIZE + 3,
              width: CELL_SIZE - 6,
              height: CELL_SIZE - 6,
              borderRadius: "50%",
              zIndex: 20,
              ...getRotationStyle(agent.direction),
            }}
          >
            {/* Direction indicator (line pointing forward) */}
            <div
              className="absolute bg-white rounded-full"
              style={{
                width: 3,
                height: 8,
                top: 1,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
