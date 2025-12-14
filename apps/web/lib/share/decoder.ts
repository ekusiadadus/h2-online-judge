/**
 * Share URL Decoder
 *
 * Decodes a compressed, URL-safe string back to playground state.
 * Uses lz-string for decompression.
 */

import { decompressFromEncodedURIComponent } from "lz-string";
import type {
  ShareState,
  CompactShareState,
  DecodeResult,
} from "./types";
import type { Direction } from "@/lib/h2lang/types";

/**
 * Convert compact state back to full ShareState format.
 *
 * @param compact - The compact share state
 * @returns Full share state
 */
export function fromCompactState(compact: CompactShareState): ShareState {
  const state: ShareState = {
    code: compact.c,
    v: compact.v,
  };

  if (compact.p) {
    const p = compact.p;
    state.problem = {
      goals: p.g.map(([x, y]) => ({ x, y })),
      walls: p.w.map(([x, y]) => ({ x, y })),
      traps: p.t.map(([x, y]) => ({ x, y })),
      startPosition: {
        x: p.s[0],
        y: p.s[1],
        direction: p.s[2] as Direction,
      },
    };
  }

  return state;
}

/**
 * Validate that a parsed object is a valid CompactShareState.
 *
 * @param obj - The object to validate
 * @returns True if valid
 */
function isValidCompactState(obj: unknown): obj is CompactShareState {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const o = obj as Record<string, unknown>;

  // Code is required
  if (typeof o.c !== "string") {
    return false;
  }

  // Version is optional
  if (o.v !== undefined && typeof o.v !== "number") {
    return false;
  }

  // Problem is optional but must be valid if present
  if (o.p !== undefined) {
    const p = o.p as Record<string, unknown>;
    if (typeof p !== "object" || p === null) {
      return false;
    }

    // Check arrays
    if (!Array.isArray(p.g) || !Array.isArray(p.w) || !Array.isArray(p.t)) {
      return false;
    }

    // Check start position
    if (!Array.isArray(p.s) || p.s.length !== 3) {
      return false;
    }

    // Validate direction
    const validDirections = [0, 90, 180, 270];
    if (!validDirections.includes(p.s[2] as number)) {
      return false;
    }
  }

  return true;
}

/**
 * Decode a shareable URL parameter back to playground state.
 *
 * The decoding process:
 * 1. Decode from URL-safe base64
 * 2. Decompress with lz-string
 * 3. Parse JSON
 * 4. Convert from compact to full format
 *
 * @param encoded - The URL-safe encoded string
 * @returns Decode result with state or error
 */
export function decodeShareState(encoded: string): DecodeResult {
  if (!encoded || encoded.trim() === "") {
    return {
      success: false,
      error: "Empty share code",
    };
  }

  try {
    // Decompress
    const json = decompressFromEncodedURIComponent(encoded);

    if (!json) {
      return {
        success: false,
        error: "Failed to decompress share code",
      };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return {
        success: false,
        error: "Invalid JSON in share code",
      };
    }

    // Validate structure
    if (!isValidCompactState(parsed)) {
      return {
        success: false,
        error: "Invalid share code format",
      };
    }

    // Convert to full state
    const state = fromCompactState(parsed);

    return {
      success: true,
      state,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to decode share code",
    };
  }
}
