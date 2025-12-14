/**
 * Share URL Encoder
 *
 * Encodes playground state into a compressed, URL-safe string.
 * Uses lz-string for compression and base64url for URL safety.
 */

import { compressToEncodedURIComponent } from "lz-string";
import type { ShareState, CompactShareState, CompactProblem } from "./types";

/** Current version of the share format */
const SHARE_VERSION = 1;

/**
 * Convert ShareState to compact format for minimal JSON size.
 *
 * @param state - The full share state
 * @returns Compact state with short keys
 */
export function toCompactState(state: ShareState): CompactShareState {
  const compact: CompactShareState = {
    c: state.code,
    v: SHARE_VERSION,
  };

  if (state.problem) {
    const problem = state.problem;
    const compactProblem: CompactProblem = {
      g: problem.goals.map((p) => [p.x, p.y]),
      w: problem.walls.map((p) => [p.x, p.y]),
      t: problem.traps.map((p) => [p.x, p.y]),
      s: [
        problem.startPosition.x,
        problem.startPosition.y,
        problem.startPosition.direction,
      ],
    };
    compact.p = compactProblem;
  }

  return compact;
}

/**
 * Encode playground state into a shareable URL parameter.
 *
 * The encoding process:
 * 1. Convert to compact format (short keys, tuple arrays)
 * 2. Stringify to JSON
 * 3. Compress with lz-string
 * 4. Encode to URL-safe base64
 *
 * @param state - The playground state to encode
 * @returns URL-safe encoded string
 */
export function encodeShareState(state: ShareState): string {
  const compact = toCompactState(state);
  const json = JSON.stringify(compact);
  const compressed = compressToEncodedURIComponent(json);
  return compressed;
}
