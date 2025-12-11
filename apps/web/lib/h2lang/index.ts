/**
 * H2 Language Compiler Module
 *
 * This module provides a wrapper around the h2lang WebAssembly compiler.
 * It handles initialization, compilation, and validation of H2 language code.
 */

import type {
  CompileResult,
  ValidationResult,
  CompileSuccess,
  CompileFailure,
} from "./types";

export type * from "./types";

// WASM module state
let wasmModule: {
  compile: (source: string) => string;
  validate: (source: string) => string;
  version: () => string;
} | null = null;

let initPromise: Promise<void> | null = null;

/**
 * Initialize the h2lang WebAssembly module.
 * This must be called before using compile or validate functions.
 * Multiple calls are safe - initialization only happens once.
 */
export async function initH2Lang(): Promise<void> {
  if (wasmModule) return;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Dynamic import of the WASM module
      // The actual path will depend on how h2lang is packaged
      const h2lang = await import("h2lang");
      await h2lang.default();

      wasmModule = {
        compile: h2lang.compile,
        validate: h2lang.validate,
        version: h2lang.version,
      };
    } catch (error) {
      console.error("Failed to initialize h2lang WASM module:", error);
      throw new Error("Failed to initialize H2 language compiler");
    }
  })();

  return initPromise;
}

/**
 * Check if the h2lang module is initialized.
 */
export function isInitialized(): boolean {
  return wasmModule !== null;
}

/**
 * Compile H2 language source code.
 *
 * @param source - The H2 language source code
 * @returns Compilation result with program or errors
 * @throws Error if the module is not initialized
 *
 * @example
 * ```ts
 * await initH2Lang();
 * const result = compile("0: srl");
 * if (result.status === "success") {
 *   console.log(result.program.agents);
 * }
 * ```
 */
export function compile(source: string): CompileResult {
  if (!wasmModule) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  try {
    const resultJson = wasmModule.compile(source);
    return JSON.parse(resultJson) as CompileResult;
  } catch (error) {
    // Handle unexpected errors from the WASM module
    return {
      status: "error",
      errors: [
        {
          line: 0,
          column: 0,
          message:
            error instanceof Error ? error.message : "Unknown compilation error",
        },
      ],
    } satisfies CompileFailure;
  }
}

/**
 * Validate H2 language source code without full compilation.
 *
 * @param source - The H2 language source code
 * @returns Validation result
 * @throws Error if the module is not initialized
 *
 * @example
 * ```ts
 * await initH2Lang();
 * const result = validate("0: srl");
 * console.log(result.valid); // true
 * ```
 */
export function validate(source: string): ValidationResult {
  if (!wasmModule) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  try {
    const resultJson = wasmModule.validate(source);
    return JSON.parse(resultJson) as ValidationResult;
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          line: 0,
          column: 0,
          message:
            error instanceof Error ? error.message : "Unknown validation error",
        },
      ],
    };
  }
}

/**
 * Get the h2lang compiler version.
 *
 * @returns Version string
 * @throws Error if the module is not initialized
 */
export function version(): string {
  if (!wasmModule) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  return wasmModule.version();
}

/**
 * Helper function to check if a compile result is successful.
 */
export function isCompileSuccess(
  result: CompileResult
): result is CompileSuccess {
  return result.status === "success";
}

/**
 * Helper function to check if a compile result is an error.
 */
export function isCompileError(result: CompileResult): result is CompileFailure {
  return result.status === "error";
}
