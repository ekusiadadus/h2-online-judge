"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CodeEditor } from "@/components/playground/code-editor";
import { Grid } from "@/components/playground/grid";
import { ControlPanel } from "@/components/playground/control-panel";
import { OutputPanel } from "@/components/playground/output-panel";
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

  // Code state
  const [code, setCode] = useState("0: srl");

  // Compilation state
  const [compileResult, setCompileResult] = useState<CompileResult | null>(
    null
  );

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Handle code compilation (mock for now)
  const handleCompile = useCallback(() => {
    // Mock compilation result
    const mockResult: CompileResult = {
      status: "success",
      program: {
        agents: [
          {
            id: 0,
            commands: [
              { type: "straight", steps: 1 },
              { type: "rotate_right", angle: 90 },
              { type: "rotate_left", angle: -90 },
            ],
          },
        ],
        max_steps: 3,
        timeline: [
          {
            step: 0,
            agent_commands: [
              { agent_id: 0, command: { type: "straight", steps: 1 } },
            ],
          },
          {
            step: 1,
            agent_commands: [
              { agent_id: 0, command: { type: "rotate_right", angle: 90 } },
            ],
          },
          {
            step: 2,
            agent_commands: [
              { agent_id: 0, command: { type: "rotate_left", angle: -90 } },
            ],
          },
        ],
      },
    };
    setCompileResult(mockResult);
    setCurrentStep(0);
  }, []);

  // Handle run
  const handleRun = useCallback(() => {
    if (!compileResult || compileResult.status !== "success") {
      handleCompile();
    }
    setIsRunning(true);
  }, [compileResult, handleCompile]);

  // Handle step
  const handleStep = useCallback(() => {
    if (!compileResult || compileResult.status !== "success") {
      handleCompile();
      return;
    }
    const program = compileResult.program;
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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col p-4 gap-4">
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Grid Visualization */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("grid.title", { defaultValue: "Grid" })}
          </h2>
          <Grid
            program={program}
            currentStep={currentStep}
            isRunning={isRunning}
            className="flex-1"
          />
        </div>

        {/* Code Editor */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium mb-2 text-muted-foreground">
            {t("editor.title", { defaultValue: "Code" })}
          </h2>
          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder={t("editor.placeholder")}
            className="flex-1"
          />
        </div>
      </div>

      {/* Output Panel */}
      <OutputPanel compileResult={compileResult} currentStep={currentStep} />
    </div>
  );
}
