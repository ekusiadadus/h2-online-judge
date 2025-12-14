/**
 * Share URL Encoder Tests
 *
 * TDD tests for encoding playground state into shareable URLs.
 */

import { describe, it, expect } from "vitest";
import { encodeShareState, toCompactState } from "@/lib/share/encoder";
import type { ShareState, CompactShareState } from "@/lib/share/types";

describe("encodeShareState", () => {
  it("encodes simple code-only state", () => {
    const state: ShareState = {
      code: "srl",
    };

    const encoded = encodeShareState(state);

    // Should return a non-empty URL-safe string
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe("string");
    // Should be URL-safe (lz-string compressToEncodedURIComponent output)
    expect(encoded).toMatch(/^[A-Za-z0-9+/=-]+$/);
  });

  it("encodes state with problem configuration", () => {
    const state: ShareState = {
      code: "0: srl\n1: lrs",
      problem: {
        goals: [{ x: 5, y: 5 }, { x: 10, y: 10 }],
        walls: [{ x: 3, y: 3 }],
        traps: [{ x: 7, y: 7 }],
        startPosition: { x: 12, y: 12, direction: 0 },
      },
    };

    const encoded = encodeShareState(state);

    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe("string");
    expect(encoded).toMatch(/^[A-Za-z0-9+/=-]+$/);
  });

  it("produces deterministic output for same input", () => {
    const state: ShareState = {
      code: "srl",
    };

    const encoded1 = encodeShareState(state);
    const encoded2 = encodeShareState(state);

    expect(encoded1).toBe(encoded2);
  });

  it("handles empty code", () => {
    const state: ShareState = {
      code: "",
    };

    const encoded = encodeShareState(state);

    expect(encoded).toBeTruthy();
  });

  it("handles unicode characters in code", () => {
    const state: ShareState = {
      code: "// コメント\nsrl",
    };

    const encoded = encodeShareState(state);

    expect(encoded).toBeTruthy();
    expect(encoded).toMatch(/^[A-Za-z0-9+/=-]+$/);
  });

  it("handles large code blocks", () => {
    const state: ShareState = {
      code: "0: " + "srl".repeat(100) + "\n1: " + "lrs".repeat(100),
    };

    const encoded = encodeShareState(state);

    expect(encoded).toBeTruthy();
    // Compressed should be reasonably sized
    expect(encoded.length).toBeLessThan(state.code.length * 2);
  });

  it("handles complex problem with many goals", () => {
    const goals = Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: i,
    }));

    const state: ShareState = {
      code: "srl",
      problem: {
        goals,
        walls: [],
        traps: [],
        startPosition: { x: 0, y: 0, direction: 90 },
      },
    };

    const encoded = encodeShareState(state);

    expect(encoded).toBeTruthy();
  });
});

describe("toCompactState", () => {
  it("converts ShareState to CompactShareState with minimal keys", () => {
    const state: ShareState = {
      code: "srl",
    };

    const compact = toCompactState(state);

    expect(compact).toEqual({
      c: "srl",
      v: 1,
    });
  });

  it("converts problem to compact format with tuple arrays", () => {
    const state: ShareState = {
      code: "srl",
      problem: {
        goals: [{ x: 5, y: 10 }],
        walls: [{ x: 3, y: 4 }],
        traps: [{ x: 7, y: 8 }],
        startPosition: { x: 12, y: 12, direction: 180 },
      },
    };

    const compact = toCompactState(state);

    expect(compact).toEqual({
      c: "srl",
      p: {
        g: [[5, 10]],
        w: [[3, 4]],
        t: [[7, 8]],
        s: [12, 12, 180],
      },
      v: 1,
    });
  });

  it("omits problem when not provided", () => {
    const state: ShareState = {
      code: "test",
    };

    const compact = toCompactState(state);

    expect(compact.p).toBeUndefined();
  });

  it("preserves all directions correctly", () => {
    const directions = [0, 90, 180, 270] as const;

    for (const direction of directions) {
      const state: ShareState = {
        code: "",
        problem: {
          goals: [],
          walls: [],
          traps: [],
          startPosition: { x: 0, y: 0, direction },
        },
      };

      const compact = toCompactState(state);

      expect(compact.p?.s[2]).toBe(direction);
    }
  });

  it("handles empty arrays in problem", () => {
    const state: ShareState = {
      code: "srl",
      problem: {
        goals: [],
        walls: [],
        traps: [],
        startPosition: { x: 12, y: 12, direction: 0 },
      },
    };

    const compact = toCompactState(state);

    expect(compact.p).toEqual({
      g: [],
      w: [],
      t: [],
      s: [12, 12, 0],
    });
  });
});
