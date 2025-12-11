import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, options?: { defaultValue?: string }) => {
    const translations: Record<string, string> = {
      title: "Output",
      success: "Compile successful",
      error: "Compile error",
      waiting: "Press Run or Step to compile and execute",
    };
    return translations[key] || options?.defaultValue || key;
  },
}));

import { OutputPanel } from "../../../components/playground/output-panel";
import type { CompileResult } from "../../../lib/h2lang/types";

describe("OutputPanel", () => {
  it("renders waiting message when no compile result", () => {
    render(<OutputPanel compileResult={null} currentStep={0} />);

    expect(
      screen.getByText(/press run or step to compile/i)
    ).toBeInTheDocument();
  });

  it("renders success message on successful compilation", () => {
    const result: CompileResult = {
      status: "success",
      program: {
        agents: [{ id: 0, commands: [] }],
        max_steps: 3,
        timeline: [],
      },
    };

    render(<OutputPanel compileResult={result} currentStep={0} />);

    expect(screen.getByText("Compile successful")).toBeInTheDocument();
  });

  it("displays step count on success", () => {
    const result: CompileResult = {
      status: "success",
      program: {
        agents: [{ id: 0, commands: [] }],
        max_steps: 5,
        timeline: [],
      },
    };

    render(<OutputPanel compileResult={result} currentStep={2} />);

    expect(screen.getByText(/step: 2 \/ 5/i)).toBeInTheDocument();
  });

  it("displays agent count on success", () => {
    const result: CompileResult = {
      status: "success",
      program: {
        agents: [{ id: 0, commands: [] }, { id: 1, commands: [] }],
        max_steps: 3,
        timeline: [],
      },
    };

    render(<OutputPanel compileResult={result} currentStep={0} />);

    expect(screen.getByText(/agents: 2/i)).toBeInTheDocument();
  });

  it("renders error message on failed compilation", () => {
    const result: CompileResult = {
      status: "error",
      errors: [
        { line: 1, column: 5, message: "Unexpected token" },
      ],
    };

    render(<OutputPanel compileResult={result} currentStep={0} />);

    expect(screen.getByText("Compile error")).toBeInTheDocument();
  });

  it("displays error details", () => {
    const result: CompileResult = {
      status: "error",
      errors: [
        { line: 1, column: 5, message: "Unexpected token" },
      ],
    };

    render(<OutputPanel compileResult={result} currentStep={0} />);

    expect(
      screen.getByText(/line 1, column 5: unexpected token/i)
    ).toBeInTheDocument();
  });
});
