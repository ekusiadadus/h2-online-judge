/**
 * H2 Language Server-Side Module
 *
 * This module provides h2lang WASM functionality for server-side use (API routes).
 * It handles initialization and provides countBytes for code golf scoring.
 */

import type { CountBytesResult } from "./types";

// WASM module state for server
let serverWasmInitialized = false;
let serverInitPromise: Promise<void> | null = null;
let serverCountBytesFn: ((source: string) => CountBytesResult) | null = null;

/**
 * Initialize the h2lang WASM module for server-side use.
 */
async function initServerH2Lang(): Promise<void> {
  if (serverWasmInitialized) return;

  if (serverInitPromise) {
    return serverInitPromise;
  }

  serverInitPromise = (async () => {
    try {
      const h2lang = await import("h2lang");
      await h2lang.default();
      h2lang.init();
      serverCountBytesFn = h2lang.count_bytes;
      serverWasmInitialized = true;
    } catch (error) {
      console.error("Failed to initialize h2lang WASM on server:", error);
      throw new Error("Failed to initialize H2 language compiler on server");
    }
  })();

  return serverInitPromise;
}

/**
 * Count bytes in H2 source code on the server.
 *
 * This function initializes WASM if needed and counts bytes
 * according to HOJ specification (excluding whitespace/comments).
 *
 * Falls back to TextEncoder if WASM fails.
 *
 * @param source - The H2 language source code
 * @returns Number of effective bytes
 */
export async function countBytesServer(source: string): Promise<number> {
  try {
    await initServerH2Lang();

    if (!serverCountBytesFn) {
      // Fallback to TextEncoder if WASM not available
      return new TextEncoder().encode(source).length;
    }

    const result = serverCountBytesFn(source) as CountBytesResult;
    if (result.status === "success") {
      return result.bytes;
    }

    // On error (syntax error), fall back to TextEncoder
    return new TextEncoder().encode(source).length;
  } catch {
    // Fallback to TextEncoder if WASM fails
    return new TextEncoder().encode(source).length;
  }
}
import 'server-only';
