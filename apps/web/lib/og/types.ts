/**
 * OG Image Types
 */

import type { Problem, Position, Direction } from "@/lib/h2lang/types";

/**
 * Parameters for problem share OG image.
 */
export interface ProblemShareParams {
  /** Share code to decode problem */
  shareCode: string;
}

/**
 * Parameters for solution share OG image (after solving).
 */
export interface SolutionShareParams {
  /** Share code to decode problem */
  shareCode: string;
  /** User's rank on leaderboard */
  rank: number;
  /** Code length in bytes */
  bytes: number;
  /** Username */
  username: string;
}

/**
 * Decoded problem data for OG rendering.
 */
export interface OGProblemData {
  /** Goals positions */
  goals: Position[];
  /** Walls positions */
  walls: Position[];
  /** Traps positions */
  traps: Position[];
  /** Start position and direction */
  startPosition: {
    x: number;
    y: number;
    direction: Direction;
  };
  /** Code (if available) */
  code?: string;
}

/**
 * Agent render state for OG image.
 */
export interface OGAgentState {
  id: number;
  x: number;
  y: number;
  direction: Direction;
}
