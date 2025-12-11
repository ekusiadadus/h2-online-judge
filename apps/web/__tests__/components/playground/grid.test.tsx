import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "../../../components/playground/grid";
import type { Program } from "../../../lib/h2lang/types";

describe("Grid", () => {
  it("renders grid container", () => {
    render(<Grid program={null} currentStep={0} isRunning={false} />);

    expect(screen.getByRole("img", { name: /robot grid/i })).toBeInTheDocument();
  });

  it("renders default agent when no program", () => {
    const { container } = render(
      <Grid program={null} currentStep={0} isRunning={false} />
    );

    // Should have one agent (default)
    const agents = container.querySelectorAll('[class*="bg-agent-"]');
    expect(agents).toHaveLength(1);
  });

  it("renders multiple agents when program has multiple agents", () => {
    const program: Program = {
      agents: [
        { id: 0, commands: [] },
        { id: 1, commands: [] },
        { id: 2, commands: [] },
      ],
      max_steps: 0,
      timeline: [],
    };

    const { container } = render(
      <Grid program={program} currentStep={0} isRunning={false} />
    );

    const agents = container.querySelectorAll('[class*="bg-agent-"]');
    expect(agents).toHaveLength(3);
  });

  it("renders grid with correct size (25x25 default)", () => {
    render(
      <Grid program={null} currentStep={0} isRunning={false} />
    );

    const grid = screen.getByRole("img", { name: /robot grid/i });
    // 25x25 grid at 24px each = 600px (Herbert Online Judge specification)
    expect(grid).toHaveStyle({ width: "600px", height: "600px" });
  });
});
