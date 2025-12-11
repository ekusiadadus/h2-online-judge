"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CodeEditor } from "@/components/playground/code-editor";
import { Grid } from "@/components/playground/grid";
import { ControlPanel } from "@/components/playground/control-panel";
import { OutputPanel } from "@/components/playground/output-panel";
import { initH2Lang, compile, isInitialized } from "@/lib/h2lang";
import type { CompileResult, Program } from "@/lib/h2lang/types";

/**
 * Playground page for H2 language programming.
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │  Control Panel                              │
 * ├─────────────────────┬───────────────────────┤
 * │                     │                       │
 * │      Grid           │   Code Editor         │
 * │                     │                       │
 * ├─────────────────────┴───────────────────────┤
 * │  Output Panel                               │
 * └─────────────────────────────────────────────┘
 */
export default function PlaygroundPage() {
  const t = useTranslations("playground");

  // WASM initialization state
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);

  // Code state (single agent can omit "0:" prefix in h2lang v0.2.0+)
  const [code, setCode] = useState("srl");

  // Compilation state
  const [compileResult, setCompileResult] = useState<CompileResult | null>(
    null
  );

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Ref for animation interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WASM on mount
  useEffect(() => {
    if (isInitialized()) {
      setWasmReady(true);
      return;
    }

    initH2Lang()
      .then(() => {
        setWasmReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize h2lang:", error);
        setWasmError(error.message);
      });
  }, []);

  // Handle code compilation using real h2lang WASM
  const handleCompile = useCallback(() => {
    if (!wasmReady) {
      setCompileResult({
        status: "error",
        errors: [{ line: 0, column: 0, message: "Compiler not ready" }],
      });
      return null;
    }

    try {
      const result = compile(code);
      setCompileResult(result);
      setCurrentStep(0);
      return result;
    } catch (error) {
      const errorResult: CompileResult = {
        status: "error",
        errors: [
          {
            line: 0,
            column: 0,
            message: error instanceof Error ? error.message : "Compilation failed",
          },
        ],
      };
      setCompileResult(errorResult);
      return errorResult;
    }
  }, [code, wasmReady]);

  // Auto-run effect: advance steps when running
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const program = compileResult?.status === "success" ? compileResult.program : null;
    if (!program) {
      setIsRunning(false);
      return;
    }

    // Calculate interval based on speed (1x = 500ms, 2x = 250ms, 4x = 125ms)
    const intervalMs = 500 / speed;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= program.max_steps) {
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, compileResult, speed]);

  // Handle run
  const handleRun = useCallback(() => {
    let result = compileResult;

    // Compile if not already compiled or if there are errors
    if (!result || result.status !== "success") {
      result = handleCompile();
    }

    if (result?.status === "success") {
      setCurrentStep(0);
      setIsRunning(true);
    }
  }, [compileResult, handleCompile]);

  // Handle step
  const handleStep = useCallback(() => {
    // Stop auto-run if running
    setIsRunning(false);

    let result = compileResult;

    // Compile if not already compiled
    if (!result || result.status !== "success") {
      result = handleCompile();
      if (!result || result.status !== "success") {
        return;
      }
    }

    const program = result.program;
    if (currentStep < program.max_steps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [compileResult, currentStep, handleCompile]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
  }, []);

  // Handle speed change
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // Get program if compilation was successful
  const program: Program | null =
    compileResult?.status === "success" ? compileResult.program : null;

  // Show error if WASM failed to load
  if (wasmError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive">Failed to load compiler: {wasmError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Control Panel */}
      <ControlPanel
        onRun={handleRun}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        isRunning={isRunning}
        speed={speed}
      />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grid Visualization */}
        <div className="flex flex-col">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("grid.title", { defaultValue: "Grid" })}
          </h2>
          <Grid
            program={program}
            currentStep={currentStep}
            isRunning={isRunning}
          />
        </div>

        {/* Code Editor */}
        <div className="flex flex-col">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("editor.title", { defaultValue: "Code" })}
            {!wasmReady && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Loading compiler...)
              </span>
            )}
          </h2>
          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder={t("editor.placeholder")}
            className="min-h-[632px]"
            disabled={!wasmReady}
          />
        </div>
      </div>

      {/* Output Panel */}
      <OutputPanel compileResult={compileResult} currentStep={currentStep} />
    </div>
  );
}
