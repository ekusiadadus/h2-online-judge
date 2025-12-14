/**
 * Easy Preset: First Steps
 *
 * A simple problem to introduce the basic commands.
 * Goal: Move forward 3 times to reach the target.
 */

import type { Preset } from "./types";

/**
 * Easy preset: Move forward to reach a single goal.
 *
 * Grid layout (25x25, showing relevant area):
 * ```
 * [12,12] Start (facing right)
 * [15,12] Goal
 * ```
 *
 * Solution: sss (3 steps forward)
 */
export const easyPreset: Preset = {
  id: "easy-first-steps",
  nameKey: "presets.easy.name",
  descriptionKey: "presets.easy.description",
  difficulty: "easy",
  problem: {
    goals: [{ x: 15, y: 12 }],
    walls: [],
    traps: [],
    startPosition: { x: 12, y: 12, direction: 0 },
  },
  sampleCode: "// Move forward to reach the goal\n// s = step forward\n",
};
