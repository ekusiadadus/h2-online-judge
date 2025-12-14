/**
 * Share URL Decoder Tests
 *
 * TDD tests for decoding shareable URLs back to playground state.
 */

import { describe, it, expect } from "vitest";
import { decodeShareState, fromCompactState } from "@/lib/share/decoder";
import { encodeShareState } from "@/lib/share/encoder";
import type { ShareState, CompactShareState } from "@/lib/share/types";

describe("decodeShareState", () => {
  it("decodes simple code-only state", () => {
    const original: ShareState = {
      code: "srl",
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe("srl");
    }
  });

  it("decodes state with problem configuration", () => {
    const original: ShareState = {
      code: "0: srl\n1: lrs",
      problem: {
        goals: [{ x: 5, y: 5 }, { x: 10, y: 10 }],
        walls: [{ x: 3, y: 3 }],
        traps: [{ x: 7, y: 7 }],
        startPosition: { x: 12, y: 12, direction: 0 },
      },
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
      expect(result.state.problem).toEqual(original.problem);
    }
  });

  it("returns error for invalid base64", () => {
    const result = decodeShareState("!!!invalid!!!");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns error for corrupted data", () => {
    const result = decodeShareState("YWJjZGVm"); // "abcdef" base64

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns error for empty string", () => {
    const result = decodeShareState("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("handles unicode characters in code", () => {
    const original: ShareState = {
      code: "// コメント\nsrl",
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
    }
  });

  it("handles large code blocks", () => {
    const original: ShareState = {
      code: "0: " + "srl".repeat(100) + "\n1: " + "lrs".repeat(100),
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
    }
  });

  it("preserves all direction values", () => {
    const directions = [0, 90, 180, 270] as const;

    for (const direction of directions) {
      const original: ShareState = {
        code: "s",
        problem: {
          goals: [],
          walls: [],
          traps: [],
          startPosition: { x: 5, y: 5, direction },
        },
      };

      const encoded = encodeShareState(original);
      const result = decodeShareState(encoded);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state.problem?.startPosition.direction).toBe(direction);
      }
    }
  });

  it("round-trips complex problem with many elements", () => {
    const original: ShareState = {
      code: "srlsrlsrl",
      problem: {
        goals: Array.from({ length: 10 }, (_, i) => ({ x: i, y: i })),
        walls: Array.from({ length: 5 }, (_, i) => ({ x: i + 10, y: i })),
        traps: Array.from({ length: 3 }, (_, i) => ({ x: i + 15, y: i })),
        startPosition: { x: 12, y: 12, direction: 270 },
      },
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
      expect(result.state.problem).toEqual(original.problem);
    }
  });
});

describe("fromCompactState", () => {
  it("converts CompactShareState to ShareState", () => {
    const compact: CompactShareState = {
      c: "srl",
      v: 1,
    };

    const state = fromCompactState(compact);

    expect(state).toEqual({
      code: "srl",
      problem: undefined,
      v: 1,
    });
  });

  it("converts compact problem format to full format", () => {
    const compact: CompactShareState = {
      c: "srl",
      p: {
        g: [[5, 10], [6, 11]],
        w: [[3, 4]],
        t: [[7, 8]],
        s: [12, 12, 180],
      },
      v: 1,
    };

    const state = fromCompactState(compact);

    expect(state).toEqual({
      code: "srl",
      problem: {
        goals: [{ x: 5, y: 10 }, { x: 6, y: 11 }],
        walls: [{ x: 3, y: 4 }],
        traps: [{ x: 7, y: 8 }],
        startPosition: { x: 12, y: 12, direction: 180 },
      },
      v: 1,
    });
  });

  it("handles missing problem field", () => {
    const compact: CompactShareState = {
      c: "test",
      v: 1,
    };

    const state = fromCompactState(compact);

    expect(state.problem).toBeUndefined();
  });

  it("handles empty arrays in compact problem", () => {
    const compact: CompactShareState = {
      c: "srl",
      p: {
        g: [],
        w: [],
        t: [],
        s: [0, 0, 0],
      },
      v: 1,
    };

    const state = fromCompactState(compact);

    expect(state.problem).toEqual({
      goals: [],
      walls: [],
      traps: [],
      startPosition: { x: 0, y: 0, direction: 0 },
    });
  });

  it("preserves version number", () => {
    const compact: CompactShareState = {
      c: "",
      v: 2,
    };

    const state = fromCompactState(compact);

    expect(state.v).toBe(2);
  });
});

describe("encode/decode integration", () => {
  it("round-trips empty problem", () => {
    const original: ShareState = {
      code: "",
      problem: {
        goals: [],
        walls: [],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      },
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
      expect(result.state.problem).toEqual(original.problem);
    }
  });

  it("handles special characters in code", () => {
    const original: ShareState = {
      code: "// Test: !@#$%^&*()\n0: srl",
    };

    const encoded = encodeShareState(original);
    const result = decodeShareState(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.code).toBe(original.code);
    }
  });

  it("produces URL-safe encoded strings", () => {
    const original: ShareState = {
      code: "srl",
      problem: {
        goals: [{ x: 24, y: 24 }],
        walls: [],
        traps: [],
        startPosition: { x: 0, y: 0, direction: 0 },
      },
    };

    const encoded = encodeShareState(original);

    // Verify it's URL-safe by checking no encoding needed
    expect(encodeURIComponent(encoded)).toBe(encoded);
  });
});
