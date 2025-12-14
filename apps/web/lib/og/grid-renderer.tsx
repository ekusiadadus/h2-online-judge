/**
 * OG Image Grid Renderer
 *
 * Renders the playground grid as JSX for ImageResponse.
 * Exactly matches the playground grid.tsx design.
 *
 * Note: Uses inline styles because Satori (ImageResponse) only supports
 * a subset of CSS and does not support Tailwind classes.
 */

import { OG_COLORS, OG_GRID } from "./colors";
import type { OGProblemData, OGAgentState } from "./types";

const { size: GRID_SIZE, cellSize: CELL_SIZE } = OG_GRID;

/**
 * Check if a position exists in a list.
 */
function hasPosition(
  positions: { x: number; y: number }[],
  x: number,
  y: number
): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

/**
 * Get direction in degrees from Direction type.
 */
function getDirectionDegrees(direction: number): number {
  // 0: up (0°), 1: right (90°), 2: down (180°), 3: left (270°)
  // Or direct degrees: 0, 90, 180, 270
  if (direction <= 3) {
    return direction * 90;
  }
  return direction;
}

interface GridCellProps {
  x: number;
  y: number;
}

/**
 * Single grid cell - matches grid.tsx GridCell component.
 */
function GridCellOG({ x, y }: GridCellProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * CELL_SIZE,
        top: y * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: OG_COLORS.gridCell,
        border: `1px solid ${OG_COLORS.gridLine}`,
      }}
    />
  );
}

interface WallProps {
  x: number;
  y: number;
}

/**
 * Wall element - matches grid.tsx Wall component.
 * Positioned 2px inside cell.
 */
function WallOG({ x, y }: WallProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * CELL_SIZE + 2,
        top: y * CELL_SIZE + 2,
        width: CELL_SIZE - 4,
        height: CELL_SIZE - 4,
        backgroundColor: OG_COLORS.wall,
      }}
    />
  );
}

interface TrapProps {
  x: number;
  y: number;
}

/**
 * Trap element - matches grid.tsx Trap component.
 * Rounded, positioned 4px inside cell.
 */
function TrapOG({ x, y }: TrapProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * CELL_SIZE + 4,
        top: y * CELL_SIZE + 4,
        width: CELL_SIZE - 8,
        height: CELL_SIZE - 8,
        backgroundColor: OG_COLORS.trap,
        borderRadius: "50%",
      }}
    />
  );
}

interface GoalProps {
  x: number;
  y: number;
  isVisited?: boolean;
}

/**
 * Goal element - matches grid.tsx Goal component.
 * Rounded with border, positioned 5px inside cell.
 */
function GoalOG({ x, y, isVisited = false }: GoalProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * CELL_SIZE + 5,
        top: y * CELL_SIZE + 5,
        width: CELL_SIZE - 10,
        height: CELL_SIZE - 10,
        backgroundColor: isVisited
          ? OG_COLORS.goalVisited
          : OG_COLORS.goalDefault,
        border: `2px solid ${
          isVisited ? OG_COLORS.goalVisitedBorder : OG_COLORS.goalDefaultBorder
        }`,
        borderRadius: "50%",
      }}
    />
  );
}

interface AgentProps {
  id: number;
  x: number;
  y: number;
  direction: number;
}

/**
 * Agent element - matches grid.tsx Agent component.
 * Colored circle with direction indicator.
 */
function AgentOG({ id, x, y, direction }: AgentProps) {
  const color = OG_COLORS.agents[id % OG_COLORS.agents.length];
  const degrees = getDirectionDegrees(direction);

  return (
    <div
      style={{
        position: "absolute",
        left: x * CELL_SIZE + 3,
        top: y * CELL_SIZE + 3,
        width: CELL_SIZE - 6,
        height: CELL_SIZE - 6,
        backgroundColor: color,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${degrees}deg)`,
      }}
    >
      {/* Direction indicator - white bar at top */}
      <div
        style={{
          position: "absolute",
          width: 2,
          height: 6,
          top: 1,
          backgroundColor: OG_COLORS.directionIndicator,
          borderRadius: 1,
        }}
      />
    </div>
  );
}

interface OGGridProps {
  problem: OGProblemData;
  /** Optional visited goals for solution share */
  visitedGoals?: { x: number; y: number }[];
}

/**
 * Complete grid renderer for OG images.
 * Renders the full 25x25 grid with all elements.
 */
export function OGGrid({ problem, visitedGoals = [] }: OGGridProps) {
  const gridPixelSize = GRID_SIZE * CELL_SIZE;

  // Create grid cells
  const cells: React.ReactElement[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push(<GridCellOG key={`cell-${x}-${y}`} x={x} y={y} />);
    }
  }

  // Initial agent state at start position
  const agent: OGAgentState = {
    id: 0,
    x: problem.startPosition.x,
    y: problem.startPosition.y,
    direction: problem.startPosition.direction,
  };

  return (
    <div
      style={{
        position: "relative",
        width: gridPixelSize,
        height: gridPixelSize,
        backgroundColor: OG_COLORS.card,
        borderRadius: 8,
        border: `1px solid ${OG_COLORS.cardBorder}`,
        padding: OG_GRID.padding,
      }}
    >
      <div
        style={{
          position: "relative",
          width: gridPixelSize,
          height: gridPixelSize,
        }}
      >
        {/* Grid cells */}
        {cells}

        {/* Walls */}
        {problem.walls.map((wall, i) => (
          <WallOG key={`wall-${i}`} x={wall.x} y={wall.y} />
        ))}

        {/* Traps */}
        {problem.traps.map((trap, i) => (
          <TrapOG key={`trap-${i}`} x={trap.x} y={trap.y} />
        ))}

        {/* Goals */}
        {problem.goals.map((goal, i) => (
          <GoalOG
            key={`goal-${i}`}
            x={goal.x}
            y={goal.y}
            isVisited={hasPosition(visitedGoals, goal.x, goal.y)}
          />
        ))}

        {/* Agent */}
        <AgentOG
          id={agent.id}
          x={agent.x}
          y={agent.y}
          direction={agent.direction}
        />
      </div>
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
        padding: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: "bold",
            color: OG_COLORS.primary,
            marginRight: 12,
          }}
        >
          H2
        </span>
        <span
          style={{
            fontSize: 28,
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
          gap: 32,
          marginTop: 24,
        }}
      >
        {problem.goals.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.goalDefault,
                border: `2px solid ${OG_COLORS.goalDefaultBorder}`,
                borderRadius: "50%",
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 18 }}>
              {problem.goals.length} Goals
            </span>
          </div>
        )}
        {problem.walls.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.wall,
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 18 }}>
              {problem.walls.length} Walls
            </span>
          </div>
        )}
        {problem.traps.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: OG_COLORS.trap,
                borderRadius: "50%",
              }}
            />
            <span style={{ color: OG_COLORS.textSecondary, fontSize: 18 }}>
              {problem.traps.length} Traps
            </span>
          </div>
        )}
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 16,
          fontSize: 16,
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
