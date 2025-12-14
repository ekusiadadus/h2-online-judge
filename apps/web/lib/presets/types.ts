/**
 * Preset Problem Types
 *
 * Types for built-in playground preset problems.
 */

import type { Problem } from "@/lib/h2lang/types";

/**
 * Difficulty level for preset problems.
 */
export type PresetDifficulty = "easy" | "medium" | "hard";

/**
 * A preset problem with metadata.
 */
export interface Preset {
  /** Unique identifier for the preset */
  id: string;
  /** Translation key for the preset name */
  nameKey: string;
  /** Translation key for the preset description */
  descriptionKey: string;
  /** Difficulty level */
  difficulty: PresetDifficulty;
  /** Problem configuration */
  problem: Problem;
  /** Sample code to start with */
  sampleCode: string;
}
