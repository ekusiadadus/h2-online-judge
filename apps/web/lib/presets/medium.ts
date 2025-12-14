/**
 * Medium Preset: Around the Wall
 *
 * Navigate around a wall to reach the goal.
 * Requires understanding of rotation commands.
 */

import type { Preset } from "./types";

/**
 * Medium preset: Navigate around a wall to reach the goal.
 *
 * Grid layout (25x25, showing relevant area):
 * ```
 * [12,12] Start (facing right)
 * [13,12] Wall
 * [14,12] Wall
 * [15,11] Goal
 * ```
 *
 * Solution: lsssrsss or similar
 */
export const mediumPreset: Preset = {
  id: "medium-around-wall",
  nameKey: "presets.medium.name",
  descriptionKey: "presets.medium.description",
  difficulty: "medium",
  problem: {
    goals: [{ x: 15, y: 11 }],
    walls: [
      { x: 13, y: 12 },
      { x: 14, y: 12 },
      { x: 15, y: 12 },
    ],
    traps: [],
    startPosition: { x: 12, y: 12, direction: 0 },
  },
  sampleCode: "// Navigate around the wall\n// s = step, r = turn right, l = turn left\n",
};
