import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      run: "Run",
      step: "Step",
      stop: "Stop",
      reset: "Reset",
      speed: "Speed",
    };
    return translations[key] || key;
  },
}));

import { ControlPanel } from "../../../components/playground/control-panel";

describe("ControlPanel", () => {
  const defaultProps = {
    onRun: vi.fn(),
    onStep: vi.fn(),
    onReset: vi.fn(),
    onSpeedChange: vi.fn(),
    isRunning: false,
    speed: 1,
  };

  it("renders run button", () => {
    render(<ControlPanel {...defaultProps} />);

    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
  });

  it("renders step button", () => {
    render(<ControlPanel {...defaultProps} />);

    expect(screen.getByRole("button", { name: /step/i })).toBeInTheDocument();
  });

  it("renders reset button", () => {
    render(<ControlPanel {...defaultProps} />);

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls onRun when run button is clicked", () => {
    const onRun = vi.fn();
    render(<ControlPanel {...defaultProps} onRun={onRun} />);

    fireEvent.click(screen.getByRole("button", { name: /run/i }));
    expect(onRun).toHaveBeenCalled();
  });

  it("calls onStep when step button is clicked", () => {
    const onStep = vi.fn();
    render(<ControlPanel {...defaultProps} onStep={onStep} />);

    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    expect(onStep).toHaveBeenCalled();
  });

  it("calls onReset when reset button is clicked", () => {
    const onReset = vi.fn();
    render(<ControlPanel {...defaultProps} onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it("disables step button when running", () => {
    render(<ControlPanel {...defaultProps} isRunning={true} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /step/i })).toBeDisabled();
  });

  it("shows stop button instead of run button when running", () => {
    const onStop = vi.fn();
    render(<ControlPanel {...defaultProps} isRunning={true} onStop={onStop} />);

    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /run/i })).not.toBeInTheDocument();
  });

  it("calls onStop when stop button is clicked", () => {
    const onStop = vi.fn();
    render(<ControlPanel {...defaultProps} isRunning={true} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenCalled();
  });

  it("shows run button when not running", () => {
    render(<ControlPanel {...defaultProps} isRunning={false} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
  });

  it("renders speed options", () => {
    render(<ControlPanel {...defaultProps} />);

    expect(screen.getByText("0.5x")).toBeInTheDocument();
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("2x")).toBeInTheDocument();
    expect(screen.getByText("4x")).toBeInTheDocument();
  });

  it("calls onSpeedChange when speed option is clicked", () => {
    const onSpeedChange = vi.fn();
    render(<ControlPanel {...defaultProps} onSpeedChange={onSpeedChange} />);

    fireEvent.click(screen.getByText("2x"));
    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });
});
