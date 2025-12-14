/**
 * Hard Preset: Trap Maze
 *
 * Collect multiple goals while avoiding traps.
 * Traps reset all collected goals.
 */

import type { Preset } from "./types";

/**
 * Hard preset: Collect multiple goals while avoiding traps.
 *
 * Grid layout (25x25, showing relevant area):
 * ```
 * [12,10] Goal 1
 * [12,12] Start (facing up)
 * [14,12] Trap
 * [16,12] Goal 2
 * [12,14] Goal 3
 * ```
 *
 * Must visit all 3 goals without hitting the trap.
 */
export const hardPreset: Preset = {
  id: "hard-trap-maze",
  nameKey: "presets.hard.name",
  descriptionKey: "presets.hard.description",
  difficulty: "hard",
  problem: {
    goals: [
      { x: 12, y: 10 },
      { x: 16, y: 12 },
      { x: 12, y: 14 },
    ],
    walls: [
      { x: 13, y: 11 },
      { x: 14, y: 11 },
      { x: 15, y: 11 },
      { x: 13, y: 13 },
      { x: 14, y: 13 },
      { x: 15, y: 13 },
    ],
    traps: [{ x: 14, y: 12 }],
    startPosition: { x: 12, y: 12, direction: 270 },
  },
  sampleCode: "// Collect all goals without hitting the trap!\n// Trap resets all collected goals\n",
};
