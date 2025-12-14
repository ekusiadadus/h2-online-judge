/**
 * H2 Language Types Tests
 *
 * Tests for TypeScript type definitions matching Rust compiler output.
 */

import { describe, it, expect } from "vitest";
import type { CommandType, Command, Program } from "@/lib/h2lang/types";

describe("CommandType", () => {
  it("should include all valid command types including wait", () => {
    // These should all be valid CommandType values
    const validTypes: CommandType[] = [
      "straight",
      "rotate_right",
      "rotate_left",
      "wait",
    ];

    expect(validTypes).toHaveLength(4);
    expect(validTypes).toContain("straight");
    expect(validTypes).toContain("rotate_right");
    expect(validTypes).toContain("rotate_left");
    expect(validTypes).toContain("wait");
  });

  it("should match Rust output format", () => {
    // Simulate command from Rust compiler
    const straightCommand: Command = {
      type: "straight",
      steps: 1,
    };

    const rotateRightCommand: Command = {
      type: "rotate_right",
      angle: 90,
    };

    const rotateLeftCommand: Command = {
      type: "rotate_left",
      angle: -90,
    };

    const waitCommand: Command = {
      type: "wait",
    };

    expect(straightCommand.type).toBe("straight");
    expect(rotateRightCommand.type).toBe("rotate_right");
    expect(rotateLeftCommand.type).toBe("rotate_left");
    expect(waitCommand.type).toBe("wait");
  });
});

describe("Program", () => {
  it("should have correct structure", () => {
    const program: Program = {
      agents: [
        {
          id: 0,
          commands: [
            { type: "straight", steps: 1 },
            { type: "rotate_right", angle: 90 },
            { type: "wait" },
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
          agent_commands: [{ agent_id: 0, command: { type: "wait" } }],
        },
      ],
    };

    expect(program.agents).toHaveLength(1);
    expect(program.max_steps).toBe(3);
    expect(program.timeline).toHaveLength(3);

    const lastEntry = program.timeline[2];
    expect(lastEntry).toBeDefined();
    const lastCommand = lastEntry?.agent_commands[0];
    expect(lastCommand).toBeDefined();
    expect(lastCommand?.command.type).toBe("wait");
  });
});
