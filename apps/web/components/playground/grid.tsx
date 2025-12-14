"use client";

import React, { useMemo, memo, useCallback } from "react";
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
/** P2: Empty walls array - stable reference to prevent unnecessary re-renders */
const EMPTY_WALLS: Position[] = [];

/**
 * Check if a position is in a list of positions.
 */
function hasPosition(positions: Position[], x: number, y: number): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

// ============================================
// P0: Memoized Cell Components for Performance
// ============================================

interface GridCellProps {
  x: number;
  y: number;
  editMode: boolean;
  onClick?: (x: number, y: number) => void;
}

/**
 * Memoized grid cell - prevents 625 cells from re-rendering on every step change.
 * Only re-renders when editMode or onClick changes.
 */
const GridCell = memo(function GridCell({ x, y, editMode, onClick }: GridCellProps) {
  const handleClick = useCallback(() => {
    if (editMode && onClick) {
      onClick(x, y);
    }
  }, [editMode, onClick, x, y]);

  return (
    <div
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
      onClick={handleClick}
    />
  );
});

interface WallProps {
  x: number;
  y: number;
}

/**
 * Memoized wall component - static, never re-renders unless position changes.
 */
const Wall = memo(function Wall({ x, y }: WallProps) {
  return (
    <div
      data-testid="wall"
      className="absolute"
      style={{
        left: x * CELL_SIZE + 2,
        top: y * CELL_SIZE + 2,
        width: CELL_SIZE - 4,
        height: CELL_SIZE - 4,
        zIndex: 10,
        backgroundColor: "#1f2937",
      }}
    />
  );
});

interface TrapProps {
  x: number;
  y: number;
}

/**
 * Memoized trap component - static, never re-renders unless position changes.
 */
const Trap = memo(function Trap({ x, y }: TrapProps) {
  return (
    <div
      data-testid="trap"
      className="absolute rounded-full"
      style={{
        left: x * CELL_SIZE + 4,
        top: y * CELL_SIZE + 4,
        width: CELL_SIZE - 8,
        height: CELL_SIZE - 8,
        zIndex: 10,
        backgroundColor: "#9ca3af",
      }}
    />
  );
});

interface GoalProps {
  x: number;
  y: number;
  isVisited: boolean;
}

/**
 * Memoized goal component - only re-renders when visited state changes.
 */
const Goal = memo(function Goal({ x, y, isVisited }: GoalProps) {
  return (
    <div
      data-testid={isVisited ? "goal-visited" : "goal"}
      className={cn(
        "absolute rounded-full border-2",
        isVisited
          ? "bg-green-500 border-green-600"
          : "bg-white border-gray-300"
      )}
      style={{
        left: x * CELL_SIZE + 5,
        top: y * CELL_SIZE + 5,
        width: CELL_SIZE - 10,
        height: CELL_SIZE - 10,
        zIndex: 15,
      }}
    />
  );
});

/**
 * Agent colors by ID.
 */
const AGENT_COLORS = [
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

interface AgentProps {
  id: number;
  x: number;
  y: number;
  direction: number;
}

/**
 * Memoized agent component - only re-renders when position/direction changes.
 * Uses will-change for GPU acceleration during animations.
 */
const Agent = memo(function Agent({ id, x, y, direction }: AgentProps) {
  return (
    <div
      className={cn(
        "absolute flex items-center justify-center transition-all duration-150",
        AGENT_COLORS[id % AGENT_COLORS.length]
      )}
      style={{
        left: x * CELL_SIZE + 3,
        top: y * CELL_SIZE + 3,
        width: CELL_SIZE - 6,
        height: CELL_SIZE - 6,
        borderRadius: "50%",
        zIndex: 20,
        transform: `rotate(${direction}deg)`,
        // P3: GPU compositing hint for smooth animations
        willChange: "transform, left, top",
      }}
    >
      {/* Direction indicator */}
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
  );
});

/**
 * Path stroke colors by agent ID.
 */
const PATH_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16",
];

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
  // P2: Stable reference for default start position (only changes when gridSize changes)
  const defaultStartPosition = useMemo(() => ({
    x: Math.floor(gridSize / 2),
    y: Math.floor(gridSize / 2),
    direction: 0 as const,
  }), [gridSize]);

  // P2: Stable start position reference
  const startPosition = problem?.startPosition ?? defaultStartPosition;

  // P2: Stable walls reference (empty array is stable, problem.walls is from props)
  const walls = problem?.walls ?? EMPTY_WALLS;

  // P2: Stable callback reference for GridCell onClick
  const handleCellClick = useCallback((x: number, y: number) => {
    if (editMode && onCellClick) {
      onCellClick(x, y);
    }
  }, [editMode, onCellClick]);

  // P0: Memoized static grid cells - only re-renders when gridSize or editMode changes
  const gridCells = useMemo(() => {
    const cells: React.ReactElement[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        cells.push(
          <GridCell
            key={`${x}-${y}`}
            x={x}
            y={y}
            editMode={editMode}
            onClick={onCellClick ? handleCellClick : undefined}
          />
        );
      }
    }
    return cells;
  }, [gridSize, editMode, handleCellClick, onCellClick]);

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
        {/* P0: Static layer - Grid cells (memoized, never re-renders during animation) */}
        {gridCells}

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
                  stroke={PATH_COLORS[agentIndex % PATH_COLORS.length]}
                  strokeWidth={3}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>
        )}

        {/* P0: Static layer - Walls (memoized) */}
        {problem?.walls.map((wall, index) => (
          <Wall key={`wall-${index}`} x={wall.x} y={wall.y} />
        ))}

        {/* P0: Static layer - Traps (memoized) */}
        {problem?.traps.map((trap, index) => (
          <Trap key={`trap-${index}`} x={trap.x} y={trap.y} />
        ))}

        {/* Goals - only re-render when visited state changes */}
        {problem?.goals.map((goal, index) => (
          <Goal
            key={`goal-${index}`}
            x={goal.x}
            y={goal.y}
            isVisited={hasPosition(visitedGoals, goal.x, goal.y)}
          />
        ))}

        {/* P0+P3: Dynamic layer - Agents (memoized with will-change) */}
        {agentStates.map((agent) => (
          <Agent
            key={agent.id}
            id={agent.id}
            x={agent.x}
            y={agent.y}
            direction={agent.direction}
          />
        ))}
      </div>
    </div>
  );
}
