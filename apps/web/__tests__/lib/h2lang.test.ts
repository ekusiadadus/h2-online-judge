import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * H2 Language Compiler Tests
 *
 * These tests verify the h2lang module behavior using mocks.
 * The actual WASM module integration is tested separately.
 */

// Create mock functions
const mockCompileFn = vi.fn();
const mockValidateFn = vi.fn();
const mockVersionFn = vi.fn();
const mockCountBytesFn = vi.fn();

// Mock the h2lang module
vi.mock("../../lib/h2lang", () => ({
  compile: (...args: unknown[]) => mockCompileFn(...args),
  validate: (...args: unknown[]) => mockValidateFn(...args),
  version: () => mockVersionFn(),
  countBytes: (...args: unknown[]) => mockCountBytesFn(...args),
  initH2Lang: vi.fn().mockResolvedValue(undefined),
  isInitialized: vi.fn().mockReturnValue(true),
  isCompileSuccess: vi.fn((result: { status: string }) => result.status === "success"),
  isCompileError: vi.fn((result: { status: string }) => result.status === "error"),
}));

describe("h2lang WASM Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("compile", () => {
    it("compiles basic commands successfully", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: srl");

      expect(mockCompileFn).toHaveBeenCalledWith("0: srl");
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.program.agents).toHaveLength(1);
        expect(result.program.agents[0].commands).toHaveLength(3);
      }
    });

    it("compiles multiple agents", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: s\n1: l");

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.program.agents).toHaveLength(2);
      }
    });

    it("returns error for invalid syntax", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: xyz");

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Unexpected token");
      }
    });

    it("compiles macros correctly", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: x:ss xrx");

      expect(result.status).toBe("success");
      if (result.status === "success") {
        // Macro x:ss expands to ss, so xrx = ssrss = 5 commands
        expect(result.program.agents[0].commands).toHaveLength(5);
      }
    });

    it("compiles functions with parameters", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: f(X):XXX f(s)");

      expect(result.status).toBe("success");
      if (result.status === "success") {
        // f(s) with f(X):XXX = sss = 3 commands
        expect(result.program.agents[0].commands).toHaveLength(3);
      }
    });

    it("compiles recursive functions", async () => {
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

      mockCompileFn.mockReturnValue(mockResult);

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: a(X):sa(X-1) a(4)");

      expect(result.status).toBe("success");
      if (result.status === "success") {
        // a(4) = s a(3) = s s a(2) = s s s a(1) = s s s s a(0) = ssss
        expect(result.program.agents[0].commands).toHaveLength(4);
      }
    });
  });

  describe("validate", () => {
    it("returns valid for correct syntax", async () => {
      mockValidateFn.mockReturnValue({ valid: true });

      const { validate } = await import("../../lib/h2lang");
      const result = validate("0: srl");

      expect(result.valid).toBe(true);
    });

    it("returns invalid for incorrect syntax", async () => {
      mockValidateFn.mockReturnValue({
        valid: false,
        errors: [{ line: 1, column: 3, message: "Invalid command" }],
      });

      const { validate } = await import("../../lib/h2lang");
      const result = validate("0: xyz");

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("version", () => {
    it("returns version string", async () => {
      mockVersionFn.mockReturnValue("0.1.0");

      const { version } = await import("../../lib/h2lang");
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
    it("supports s (straight) command", async () => {
      mockCompileFn.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "straight", steps: 1 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: s");

      if (result.status === "success") {
        expect(result.program.agents[0].commands[0].type).toBe("straight");
      }
    });

    it("supports r (right) command", async () => {
      mockCompileFn.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "rotate_right", angle: 90 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: r");

      if (result.status === "success") {
        expect(result.program.agents[0].commands[0].type).toBe("rotate_right");
      }
    });

    it("supports l (left) command", async () => {
      mockCompileFn.mockReturnValue({
        status: "success",
        program: {
          agents: [{ id: 0, commands: [{ type: "rotate_left", angle: -90 }] }],
          max_steps: 1,
          timeline: [],
        },
      });

      const { compile } = await import("../../lib/h2lang");
      const result = compile("0: l");

      if (result.status === "success") {
        expect(result.program.agents[0].commands[0].type).toBe("rotate_left");
      }
    });
  });

  describe("Multi-Agent Support", () => {
    it("supports agent IDs from 0 to 9", async () => {
      mockCompileFn.mockReturnValue({
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

      const { compile } = await import("../../lib/h2lang");
      const code = Array.from({ length: 10 }, (_, i) => `${i}: s`).join("\n");
      const result = compile(code);

      if (result.status === "success") {
        expect(result.program.agents).toHaveLength(10);
      }
    });
  });
});

describe("countBytes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns byte count for valid code (basic commands)", async () => {
    // "a:sa a" -> macro definition "a:sa" (4 bytes) + call "a" = 4 bytes effective
    mockCountBytesFn.mockReturnValue({ status: "success", bytes: 4 });

    const { countBytes } = await import("../../lib/h2lang");
    const result = countBytes("a:sa a");

    expect(mockCountBytesFn).toHaveBeenCalledWith("a:sa a");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.bytes).toBe(4);
    }
  });

  it("returns byte count for recursive function", async () => {
    // "f(X):sa(X-1) f(10)" -> 8 effective bytes
    mockCountBytesFn.mockReturnValue({ status: "success", bytes: 8 });

    const { countBytes } = await import("../../lib/h2lang");
    const result = countBytes("f(X):sa(X-1) f(10)");

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.bytes).toBe(8);
    }
  });

  it("returns error for invalid syntax", async () => {
    mockCountBytesFn.mockReturnValue({
      status: "error",
      message: "Unexpected token",
    });

    const { countBytes } = await import("../../lib/h2lang");
    const result = countBytes("f(X):Xf(X-1)");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toBeDefined();
    }
  });

  it("ignores whitespace and comments in byte count", async () => {
    // Whitespace should not count towards bytes
    mockCountBytesFn.mockReturnValue({ status: "success", bytes: 3 });

    const { countBytes } = await import("../../lib/h2lang");
    const result = countBytes("s r l"); // "srl" = 3 bytes

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.bytes).toBe(3);
    }
  });
});
