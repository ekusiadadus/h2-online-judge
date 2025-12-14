/**
 * Byte count utilities for code golf scoring.
 *
 * In Herbert Online Judge, byte count is the primary scoring metric.
 * Shorter code (fewer bytes) = better score.
 */

/**
 * Calculate the byte count of a string using UTF-8 encoding.
 *
 * @param code - The code string to measure
 * @returns The number of bytes in UTF-8 encoding
 */
export function getByteCount(code: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(code).length;
  }
  // Fallback for environments without TextEncoder
  return new Blob([code]).size;
}

/**
 * Calculate the character count of a string.
 *
 * @param code - The code string to measure
 * @returns The number of characters
 */
export function getCharCount(code: string): number {
  return code.length;
}

/**
 * Format byte count for display.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "42 bytes")
 */
export function formatByteCount(bytes: number): string {
  return `${bytes} byte${bytes !== 1 ? "s" : ""}`;
}

/**
 * Get byte count statistics for code.
 *
 * @param code - The code string to analyze
 * @returns Object containing byte count, char count, and line count
 */
export function getCodeStats(code: string): {
  bytes: number;
  chars: number;
  lines: number;
} {
  return {
    bytes: getByteCount(code),
    chars: getCharCount(code),
    lines: code.split("\n").length,
  };
}
