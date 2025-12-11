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

  it("renders grid with correct size", () => {
    render(
      <Grid program={null} currentStep={0} isRunning={false} gridSize={5} />
    );

    const grid = screen.getByRole("img", { name: /robot grid/i });
    // 5x5 grid = 25 cells at 40px each = 200px
    expect(grid).toHaveStyle({ width: "200px", height: "200px" });
  });
});
