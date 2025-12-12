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

    // Step count is split across elements, so check for individual parts
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/\/ 5/)).toBeInTheDocument();
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

  describe("Timeline Display", () => {
    it("displays timeline section on successful compilation", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight" }] }],
          max_steps: 3,
          timeline: [
            { step: 0, agent_commands: [{ agent_id: 0, command: { type: "straight" } }] },
            { step: 1, agent_commands: [{ agent_id: 0, command: { type: "rotate_right" } }] },
            { step: 2, agent_commands: [{ agent_id: 0, command: { type: "rotate_left" } }] },
          ],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={0} />);

      expect(screen.getByText("Timeline")).toBeInTheDocument();
    });

    it("displays command icons for each step", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight" }] }],
          max_steps: 3,
          timeline: [
            { step: 0, agent_commands: [{ agent_id: 0, command: { type: "straight" } }] },
            { step: 1, agent_commands: [{ agent_id: 0, command: { type: "rotate_right" } }] },
            { step: 2, agent_commands: [{ agent_id: 0, command: { type: "rotate_left" } }] },
          ],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={1} />);

      // Check that timeline items exist
      expect(screen.getByTestId("timeline-step-0")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-step-1")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-step-2")).toBeInTheDocument();
    });

    it("highlights the current step", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight" }] }],
          max_steps: 3,
          timeline: [
            { step: 0, agent_commands: [{ agent_id: 0, command: { type: "straight" } }] },
            { step: 1, agent_commands: [{ agent_id: 0, command: { type: "rotate_right" } }] },
            { step: 2, agent_commands: [{ agent_id: 0, command: { type: "rotate_left" } }] },
          ],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={1} />);

      const currentStepElement = screen.getByTestId("timeline-step-1");
      expect(currentStepElement).toHaveClass("bg-primary/20");
    });

    it("shows completed steps with different styling", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight" }] }],
          max_steps: 3,
          timeline: [
            { step: 0, agent_commands: [{ agent_id: 0, command: { type: "straight" } }] },
            { step: 1, agent_commands: [{ agent_id: 0, command: { type: "rotate_right" } }] },
            { step: 2, agent_commands: [{ agent_id: 0, command: { type: "rotate_left" } }] },
          ],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={2} />);

      // Completed steps should have muted styling
      const completedStep = screen.getByTestId("timeline-step-0");
      expect(completedStep).toHaveClass("text-muted-foreground");
    });
  });

  describe("Progress Bar", () => {
    it("displays progress bar on successful compilation", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [] }],
          max_steps: 10,
          timeline: [],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={5} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("shows correct progress percentage", () => {
      const result: CompileResult = {
        status: "success",
        program: {
          agents: [{ id: 0, commands: [] }],
          max_steps: 10,
          timeline: [],
        },
      };

      render(<OutputPanel compileResult={result} currentStep={5} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "5");
      expect(progressBar).toHaveAttribute("aria-valuemax", "10");
    });
  });
});
