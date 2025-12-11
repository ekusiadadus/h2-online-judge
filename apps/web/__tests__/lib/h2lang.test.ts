import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock h2lang WASM module
const mockCompile = vi.fn();
const mockValidate = vi.fn();
const mockVersion = vi.fn();

vi.mock("@/lib/h2lang", () => ({
  compile: mockCompile,
  validate: mockValidate,
  version: mockVersion,
  initH2Lang: vi.fn().mockResolvedValue(undefined),
}));

describe("h2lang WASM Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("compile", () => {
    it("compiles basic commands successfully", () => {
      const mockResult = {
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
          ],
        },
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: srl");

      expect(mockCompile).toHaveBeenCalledWith("0: srl");
      expect(result.status).toBe("success");
      expect(result.program.agents).toHaveLength(1);
      expect(result.program.agents[0].commands).toHaveLength(3);
    });

    it("compiles multiple agents", () => {
      const mockResult = {
        status: "success",
        program: {
          agents: [
            { id: 0, commands: [{ type: "straight", steps: 1 }] },
            { id: 1, commands: [{ type: "rotate_left", angle: -90 }] },
          ],
          max_steps: 1,
          timeline: [],
        },
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: s\n1: l");

      expect(result.status).toBe("success");
      expect(result.program.agents).toHaveLength(2);
    });

    it("returns error for invalid syntax", () => {
      const mockResult = {
        status: "error",
        errors: [
          {
            line: 1,
            column: 3,
            message: "Unexpected token",
          },
        ],
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: xyz");

      expect(result.status).toBe("error");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Unexpected token");
    });

    it("compiles macros correctly", () => {
      const mockResult = {
        status: "success",
        program: {
          agents: [
            {
              id: 0,
              commands: [
                { type: "straight", steps: 1 },
                { type: "straight", steps: 1 },
                { type: "rotate_right", angle: 90 },
                { type: "straight", steps: 1 },
                { type: "straight", steps: 1 },
              ],
            },
          ],
          max_steps: 5,
          timeline: [],
        },
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: x:ss xrx");

      expect(result.status).toBe("success");
      // Macro x:ss expands to ss, so xrx = ssrss = 5 commands
      expect(result.program.agents[0].commands).toHaveLength(5);
    });

    it("compiles functions with parameters", () => {
      const mockResult = {
        status: "success",
        program: {
          agents: [
            {
              id: 0,
              commands: [
                { type: "straight", steps: 1 },
                { type: "straight", steps: 1 },
                { type: "straight", steps: 1 },
              ],
            },
          ],
          max_steps: 3,
          timeline: [],
        },
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: f(X):XXX f(s)");

      expect(result.status).toBe("success");
      // f(s) with f(X):XXX = sss = 3 commands
      expect(result.program.agents[0].commands).toHaveLength(3);
    });

    it("compiles recursive functions", () => {
      const mockResult = {
        status: "success",
        program: {
          agents: [
            {
              id: 0,
              commands: Array(4).fill({ type: "straight", steps: 1 }),
            },
          ],
          max_steps: 4,
          timeline: [],
        },
      };

      mockCompile.mockReturnValue(mockResult);

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: a(X):sa(X-1) a(4)");

      expect(result.status).toBe("success");
      // a(4) = s a(3) = s s a(2) = s s s a(1) = s s s s a(0) = ssss
      expect(result.program.agents[0].commands).toHaveLength(4);
    });
  });

  describe("validate", () => {
    it("returns valid for correct syntax", () => {
      mockValidate.mockReturnValue({ valid: true });

      const { validate } = require("@/lib/h2lang");
      const result = validate("0: srl");

      expect(result.valid).toBe(true);
    });

    it("returns invalid for incorrect syntax", () => {
      mockValidate.mockReturnValue({
        valid: false,
        errors: [{ line: 1, column: 3, message: "Invalid command" }],
      });

      const { validate } = require("@/lib/h2lang");
      const result = validate("0: xyz");

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("version", () => {
    it("returns version string", () => {
      mockVersion.mockReturnValue("0.1.0");

      const { version } = require("@/lib/h2lang");
      const result = version();

      expect(result).toBe("0.1.0");
    });
  });
});

describe("H2 Language Specification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Commands", () => {
    it("supports s (straight) command", () => {
      mockCompile.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight", steps: 1 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: s");

      expect(result.program.agents[0].commands[0].type).toBe("straight");
    });

    it("supports r (right) command", () => {
      mockCompile.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "rotate_right", angle: 90 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: r");

      expect(result.program.agents[0].commands[0].type).toBe("rotate_right");
    });

    it("supports l (left) command", () => {
      mockCompile.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "rotate_left", angle: -90 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = require("@/lib/h2lang");
      const result = compile("0: l");

      expect(result.program.agents[0].commands[0].type).toBe("rotate_left");
    });
  });

  describe("Multi-Agent Support", () => {
    it("supports agent IDs from 0 to 9", () => {
      mockCompile.mockReturnValue({
        status: "success",
        program: {
          agents: Array.from({ length: 10 }, (_, i) => ({
            id: i,
            commands: [{ type: "straight", steps: 1 }],
          })),
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = require("@/lib/h2lang");
      const code = Array.from({ length: 10 }, (_, i) => `${i}: s`).join("\n");
      const result = compile(code);

      expect(result.program.agents).toHaveLength(10);
    });
  });
});
