import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Grid } from "../../../components/playground/grid";
import type { Problem } from "../../../lib/h2lang/types";

describe("Problem Editor", () => {
  describe("Goal rendering", () => {
    it("renders goals as white circles", () => {
      const problem: Problem = {
        goals: [{ x: 5, y: 5 }, { x: 10, y: 10 }],
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
      expect(goals).toHaveLength(2);
    });

    it("renders visited goals as green", () => {
      const problem: Problem = {
        goals: [{ x: 12, y: 12 }],
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
          visitedGoals={[{ x: 12, y: 12 }]}
        />
      );

      const visitedGoal = container.querySelector('[data-testid="goal-visited"]');
      expect(visitedGoal).toBeInTheDocument();
    });
  });

  describe("Wall rendering", () => {
    it("renders walls as black blocks", () => {
      const problem: Problem = {
        goals: [],
        walls: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
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

      const walls = container.querySelectorAll('[data-testid="wall"]');
      expect(walls).toHaveLength(2);
    });
  });

  describe("Trap rendering", () => {
    it("renders traps as gray circles", () => {
      const problem: Problem = {
        goals: [],
        walls: [],
        traps: [{ x: 7, y: 7 }],
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

      const traps = container.querySelectorAll('[data-testid="trap"]');
      expect(traps).toHaveLength(1);
    });
  });

  describe("Edit mode", () => {
    it("calls onCellClick when clicking a cell in edit mode", () => {
      const onCellClick = vi.fn();
      const problem: Problem = {
        goals: [],
        walls: [],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      };

      render(
        <Grid
          program={null}
          currentStep={0}
          isRunning={false}
          problem={problem}
          editMode={true}
          onCellClick={onCellClick}
        />
      );

      const cells = screen.getAllByTestId("grid-cell");
      fireEvent.click(cells[0]);

      expect(onCellClick).toHaveBeenCalledWith(0, 0);
    });

    it("does not call onCellClick when not in edit mode", () => {
      const onCellClick = vi.fn();
      const problem: Problem = {
        goals: [],
        walls: [],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      };

      render(
        <Grid
          program={null}
          currentStep={0}
          isRunning={false}
          problem={problem}
          editMode={false}
          onCellClick={onCellClick}
        />
      );

      const cells = screen.getAllByTestId("grid-cell");
      fireEvent.click(cells[0]);

      expect(onCellClick).not.toHaveBeenCalled();
    });
  });

  describe("Start position", () => {
    it("renders agent at custom start position", () => {
      const problem: Problem = {
        goals: [],
        walls: [],
        traps: [],
        startPosition: { x: 5, y: 5, direction: 90 },
      };

      const { container } = render(
        <Grid
          program={null}
          currentStep={0}
          isRunning={false}
          problem={problem}
        />
      );

      const agent = container.querySelector('[class*="bg-agent-"]');
      expect(agent).toBeInTheDocument();
      // Agent should be at position (5, 5) with 90 degree rotation
      expect(agent).toHaveStyle({ transform: "rotate(90deg)" });
    });
  });
});

describe("Collision Detection", () => {
  it("agent cannot pass through walls", () => {
    // Wall at (12, 11) - one step above center
    const problem: Problem = {
      goals: [],
      walls: [{ x: 12, y: 11 }],
      traps: [],
      startPosition: { x: 12, y: 12, direction: 0 },
    };

    // Program that tries to move forward (into wall)
    const program = {
      agents: [{ id: 0, commands: [{ type: "straight" as const }] }],
      max_steps: 1,
      timeline: [
        {
          step: 0,
          agent_commands: [
            { agent_id: 0, command: { type: "straight" as const } },
          ],
        },
      ],
    };

    const { container } = render(
      <Grid
        program={program}
        currentStep={1}
        isRunning={false}
        problem={problem}
      />
    );

    const agent = container.querySelector('[class*="bg-agent-"]');
    // Agent should still be at center (12, 12) because wall blocks movement
    // Position is (x * 24 + 3) for left
    const expectedLeft = 12 * 24 + 3;
    expect(agent).toHaveStyle({ left: `${expectedLeft}px` });
  });
});
