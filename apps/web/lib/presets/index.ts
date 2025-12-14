/**
 * Preset Problems Module
 *
 * Built-in preset problems for the playground.
 */

export type { Preset, PresetDifficulty } from "./types";
export { easyPreset } from "./easy";
export { mediumPreset } from "./medium";
export { hardPreset } from "./hard";

import { easyPreset } from "./easy";
import { mediumPreset } from "./medium";
import { hardPreset } from "./hard";
import type { Preset } from "./types";

/**
 * All available presets in order of difficulty.
 */
export const presets: Preset[] = [easyPreset, mediumPreset, hardPreset];

/**
 * Get a preset by its ID.
 */
export function getPresetById(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}
