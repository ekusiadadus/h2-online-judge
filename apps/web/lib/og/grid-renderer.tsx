/**
 * OG Image Grid Renderer
 *
 * Renders the playground grid as JSX for ImageResponse.
 * Uses flexbox layout (not position absolute) for Satori compatibility.
 *
 * Note: Uses inline styles because Satori (ImageResponse) only supports
 * a subset of CSS and does not support Tailwind classes.
 */

import { OG_COLORS, OG_GRID } from "./colors";
import type { OGProblemData } from "./types";

const { size: GRID_SIZE, cellSize: CELL_SIZE } = OG_GRID;

interface OGGridProps {
  problem: OGProblemData;
  /** Optional visited goals for solution share */
  visitedGoals?: { x: number; y: number }[];
}

/**
 * Grid renderer using flexbox layout.
 * Satori has issues with position absolute, so we use flexbox rows instead.
 */
export function OGGrid({ problem, visitedGoals = [] }: OGGridProps) {
  // Create lookup sets for O(1) access
  const goalSet = new Set(problem.goals.map((g) => `${g.x},${g.y}`));
  const visitedGoalSet = new Set(visitedGoals.map((g) => `${g.x},${g.y}`));
  const wallSet = new Set(problem.walls.map((w) => `${w.x},${w.y}`));
  const trapSet = new Set(problem.traps.map((t) => `${t.x},${t.y}`));
  const agentKey = `${problem.startPosition.x},${problem.startPosition.y}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG_COLORS.card,
        borderRadius: 8,
        padding: 8,
        border: `1px solid ${OG_COLORS.cardBorder}`,
      }}
    >
      {Array.from({ length: GRID_SIZE }).map((_, y) => (
        <div key={y} style={{ display: "flex" }}>
          {Array.from({ length: GRID_SIZE }).map((_, x) => {
            const key = `${x},${y}`;
            let bgColor: string = OG_COLORS.gridCell;
            let borderRadius = 0;

            if (wallSet.has(key)) {
              bgColor = OG_COLORS.wall;
            } else if (trapSet.has(key)) {
              bgColor = OG_COLORS.trap;
              borderRadius = CELL_SIZE / 2;
            } else if (goalSet.has(key)) {
              bgColor = visitedGoalSet.has(key)
                ? OG_COLORS.goalVisited
                : OG_COLORS.goalDefault;
              borderRadius = CELL_SIZE / 2;
            } else if (key === agentKey) {
              bgColor = OG_COLORS.agents[0];
              borderRadius = CELL_SIZE / 2;
            }

            return (
              <div
                key={x}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: bgColor,
                  borderRadius,
                  border: `1px solid ${OG_COLORS.gridLine}`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface ProblemShareImageProps {
  problem: OGProblemData;
}

/**
 * Full OG image for problem sharing.
 * Shows the grid prominently with minimal UI.
 */
export function ProblemShareImage({ problem }: ProblemShareImageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: OG_COLORS.primary,
            marginRight: 8,
          }}
        >
          H2
        </span>
        <span
          style={{
            fontSize: 24,
            color: OG_COLORS.textPrimary,
          }}
        >
          Playground
        </span>
      </div>

      {/* Grid */}
      <OGGrid problem={problem} />

      {/* Footer with element counts */}
      <div
        style={{
          display: "flex",
          marginTop: 16,
        }}
      >
        {problem.goals.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.goalDefault,
                borderRadius: 6,
                marginRight: 6,
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 16 }}>
              {problem.goals.length} Goals
            </span>
          </div>
        )}
        {problem.walls.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.wall,
                marginRight: 6,
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 16 }}>
              {problem.walls.length} Walls
            </span>
          </div>
        )}
        {problem.traps.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.trap,
                borderRadius: 6,
                marginRight: 6,
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 16 }}>
              {problem.traps.length} Traps
            </span>
          </div>
        )}
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 12,
          fontSize: 14,
          color: OG_COLORS.textMuted,
        }}
      >
        h2-online-judge-web.vercel.app
      </div>
    </div>
  );
}

interface SolutionShareImageProps {
  problem: OGProblemData;
  rank: number;
  bytes: number;
  username: string;
}

/**
 * Full OG image for solution sharing (after solving).
 * Shows rank, byte count, and username prominently.
 */
export function SolutionShareImage({
  problem,
  rank,
  bytes,
  username,
}: SolutionShareImageProps) {
  // Rank suffix helper
  const getRankSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: OG_COLORS.background,
        padding: 40,
      }}
    >
      {/* Left side - Grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <OGGrid problem={problem} visitedGoals={problem.goals} />
      </div>

      {/* Right side - Stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 400,
          paddingLeft: 40,
        }}
      >
        {/* H2 Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: OG_COLORS.primary,
            }}
          >
            H2
          </span>
        </div>

        {/* Rank */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: rank <= 3 ? OG_COLORS.warning : OG_COLORS.textPrimary,
            }}
          >
            {rank}
          </span>
          <span
            style={{
              fontSize: 32,
              color: rank <= 3 ? OG_COLORS.warning : OG_COLORS.textSecondary,
              marginLeft: 4,
            }}
          >
            {getRankSuffix(rank)}
          </span>
        </div>

        {/* Bytes */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: OG_COLORS.success,
            }}
          >
            {bytes}
          </span>
          <span
            style={{
              fontSize: 24,
              color: OG_COLORS.textSecondary,
              marginLeft: 8,
            }}
          >
            bytes
          </span>
        </div>

        {/* Username */}
        <div
          style={{
            fontSize: 24,
            color: OG_COLORS.textSecondary,
          }}
        >
          @{username}
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 32,
            fontSize: 16,
            color: OG_COLORS.textMuted,
          }}
        >
          h2-online-judge-web.vercel.app
        </div>
      </div>
    </div>
  );
}
