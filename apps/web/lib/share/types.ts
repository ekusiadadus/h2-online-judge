/**
 * Share URL Types
 *
 * Types for encoding/decoding playground state in URL parameters.
 */

import type { Problem, Position, Direction } from "@/lib/h2lang/types";

/**
 * Shareable playground state.
 * This is the data that gets encoded into the share URL.
 */
export interface ShareState {
  /** H2 code to share */
  code: string;
  /** Optional problem configuration */
  problem?: Problem;
  /** Version for future compatibility */
  v?: number;
}

/**
 * Compact format for encoding (minimizes JSON size).
 * Uses short keys to reduce URL length.
 */
export interface CompactShareState {
  /** Code (c) */
  c: string;
  /** Problem (p) - optional */
  p?: CompactProblem;
  /** Version (v) - optional, defaults to 1 */
  v?: number;
}

/**
 * Compact problem format.
 * Arrays of [x, y] tuples instead of {x, y} objects.
 */
export interface CompactProblem {
  /** Goals as [x, y][] */
  g: [number, number][];
  /** Walls as [x, y][] */
  w: [number, number][];
  /** Traps as [x, y][] */
  t: [number, number][];
  /** Start position as [x, y, direction] */
  s: [number, number, Direction];
}

/**
 * Result of decoding a share URL.
 */
export type DecodeResult =
  | { success: true; state: ShareState }
  | { success: false; error: string };
