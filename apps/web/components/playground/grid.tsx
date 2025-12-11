"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Program } from "@/lib/h2lang/types";

interface GridProps {
  program: Program | null;
  currentStep: number;
  isRunning: boolean;
  gridSize?: number;
  className?: string;
}

interface AgentState {
  id: number;
  x: number;
  y: number;
  direction: number; // 0: up, 90: right, 180: down, 270: left
}

/** Herbert Online Judge specification: 25x25 grid */
const GRID_SIZE = 25;
/** Cell size in pixels (25 * 16 = 400px total) */
const CELL_SIZE = 16;

/**
 * Grid visualization component for H2 robot simulation.
 *
 * Displays a grid with agents moving according to the compiled program.
 */
export function Grid({
  program,
  currentStep,
  isRunning,
  gridSize = GRID_SIZE,
  className,
}: GridProps) {
  // Calculate agent states based on program and current step
  const agentStates = useMemo(() => {
    if (!program) {
      return [{ id: 0, x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2), direction: 0 }];
    }

    // Initialize agents at center
    const states: AgentState[] = program.agents.map((agent) => ({
      id: agent.id,
      x: Math.floor(gridSize / 2),
      y: Math.floor(gridSize / 2),
      direction: 0,
    }));

    // Apply commands up to current step
    for (let step = 0; step < currentStep && step < program.timeline.length; step++) {
      const timelineEntry = program.timeline[step];
      for (const agentCommand of timelineEntry.agent_commands) {
        const state = states.find((s) => s.id === agentCommand.agent_id);
        if (!state) continue;

        const command = agentCommand.command;
        if (command.type === "straight") {
          // Move forward in current direction
          const dx = Math.round(Math.sin((state.direction * Math.PI) / 180));
          const dy = -Math.round(Math.cos((state.direction * Math.PI) / 180));
          state.x = Math.max(0, Math.min(gridSize - 1, state.x + dx));
          state.y = Math.max(0, Math.min(gridSize - 1, state.y + dy));
        } else if (command.type === "rotate_right") {
          state.direction = (state.direction + 90) % 360;
        } else if (command.type === "rotate_left") {
          state.direction = (state.direction - 90 + 360) % 360;
        }
      }
    }

    return states;
  }, [program, currentStep, gridSize]);

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

  // Get rotation style for agent
  const getRotationStyle = (direction: number) => ({
    transform: `rotate(${direction}deg)`,
  });

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 overflow-auto",
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
              className="absolute border border-grid-line bg-background"
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          );
        })}

        {/* Agents */}
        {agentStates.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "absolute flex items-center justify-center transition-all duration-300",
              getAgentColor(agent.id)
            )}
            style={{
              left: agent.x * CELL_SIZE + 2,
              top: agent.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              borderRadius: "50%",
              ...getRotationStyle(agent.direction),
            }}
          >
            {/* Direction indicator (arrow) */}
            <div
              className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-white"
              style={{ marginTop: "-2px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
