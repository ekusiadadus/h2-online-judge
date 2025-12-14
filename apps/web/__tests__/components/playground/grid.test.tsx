import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "../../../components/playground/grid";
import type { Program, Problem } from "../../../lib/h2lang/types";

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

  describe("dot-style grid design", () => {
    it("renders grid dots at intersections", () => {
      const { container } = render(
        <Grid program={null} currentStep={0} isRunning={false} />
      );

      // Grid should have dot elements
      const dots = container.querySelectorAll('[data-testid="grid-dot"]');
      // 25x25 = 625 dots
      expect(dots.length).toBe(625);
    });

    it("renders walls as outline path", () => {
      const problem: Problem = {
        goals: [],
        walls: [
          { x: 10, y: 10 },
          { x: 11, y: 10 },
        ],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      };

      const { container } = render(
        <Grid
          program={null}
          currentStep={0}
          isRunning={false}
          problem={problem}
        />
      );

      // Should have wall outline SVG paths
      const wallPaths = container.querySelectorAll('[data-testid="wall-outline"]');
      expect(wallPaths.length).toBeGreaterThan(0);
    });

    it("renders goals as filled black circles", () => {
      const problem: Problem = {
        goals: [{ x: 15, y: 12 }],
        walls: [],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      };

      const { container } = render(
        <Grid
          program={null}
          currentStep={0}
          isRunning={false}
          problem={problem}
        />
      );

      const goals = container.querySelectorAll('[data-testid="goal"]');
      expect(goals.length).toBe(1);
    });

    it("renders agent as colored circle", () => {
      const { container } = render(
        <Grid program={null} currentStep={0} isRunning={false} />
      );

      // Agent should be a circle
      const agents = container.querySelectorAll('[class*="bg-agent-"]');
      expect(agents.length).toBe(1);
    });
  });
});
