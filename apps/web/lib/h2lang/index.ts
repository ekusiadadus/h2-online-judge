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
  CountBytesResult,
  CountBytesFailure,
} from "./types";

export type * from "./types";

// WASM module state
let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

// Dynamic import references
let h2langCompile: ((source: string) => CompileResult) | null = null;
let h2langValidate: ((source: string) => ValidationResult) | null = null;
let h2langVersion: (() => string) | null = null;
let h2langCountBytes: ((source: string) => CountBytesResult) | null = null;

/**
 * Initialize the h2lang WebAssembly module.
 * This must be called before using compile or validate functions.
 * Multiple calls are safe - initialization only happens once.
 */
export async function initH2Lang(): Promise<void> {
  if (wasmInitialized) return;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Dynamic import of the WASM module
      const h2lang = await import("h2lang");

      // Initialize the WASM module
      await h2lang.default();

      // Initialize panic hook for better error messages
      h2lang.init();

      // Store references to the functions
      h2langCompile = h2lang.compile;
      h2langValidate = h2lang.validate;
      h2langVersion = h2lang.version;
      h2langCountBytes = h2lang.count_bytes;

      wasmInitialized = true;
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
  return wasmInitialized;
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
 * const result = compile("srl");
 * if (result.status === "success") {
 *   console.log(result.program.agents);
 * }
 * ```
 */
export function compile(source: string): CompileResult {
  if (!wasmInitialized || !h2langCompile) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  try {
    return h2langCompile(source) as CompileResult;
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
 * const result = validate("srl");
 * console.log(result.valid); // true
 * ```
 */
export function validate(source: string): ValidationResult {
  if (!wasmInitialized || !h2langValidate) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  try {
    const result = h2langValidate(source) as { status: string; valid?: boolean; errors?: Array<{ line: number; column: number; message: string }> };

    // Convert h2lang response to ValidationResult
    if (result.status === "ok") {
      return { valid: true };
    } else {
      return {
        valid: false,
        errors: result.errors || [],
      };
    }
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
  if (!wasmInitialized || !h2langVersion) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  return h2langVersion();
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

/**
 * Count the effective bytes in H2 language source code.
 *
 * This uses the h2lang compiler to parse the code and count only
 * the meaningful bytes (excluding whitespace and comments).
 * This is the scoring metric for code golf.
 *
 * @param source - The H2 language source code
 * @returns Byte count result with count or error
 * @throws Error if the module is not initialized
 *
 * @example
 * ```ts
 * await initH2Lang();
 * const result = countBytes("a:sa a");
 * if (result.status === "success") {
 *   console.log(result.bytes); // 4
 * }
 * ```
 */
export function countBytes(source: string): CountBytesResult {
  if (!wasmInitialized || !h2langCountBytes) {
    throw new Error(
      "H2Lang module not initialized. Call initH2Lang() first."
    );
  }

  try {
    return h2langCountBytes(source) as CountBytesResult;
  } catch (error) {
    // Handle unexpected errors from the WASM module
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unknown error counting bytes",
    } satisfies CountBytesFailure;
  }
}
