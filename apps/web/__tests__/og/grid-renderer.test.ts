import { describe, it, expect } from "vitest";
import { OG_COLORS, OG_GRID, OG_DIMENSIONS } from "../../lib/og/colors";

/**
 * OG Grid Renderer Tests
 *
 * Tests for the grid rendering functionality used in OG images.
 * Ensures exact parity with playground design.
 */

describe("OG Color Constants", () => {
  describe("Background colors", () => {
    it("has dark theme background color", () => {
      expect(OG_COLORS.background).toBe("#0c1117");
    });

    it("has card background color", () => {
      expect(OG_COLORS.card).toBe("#151b24");
    });

    it("has card border color", () => {
      expect(OG_COLORS.cardBorder).toBe("#29323b");
    });
  });

  describe("Grid colors", () => {
    it("has grid line color", () => {
      expect(OG_COLORS.gridLine).toBe("#2d3640");
    });

    it("has wall color matching grid.tsx", () => {
      // Must match the hardcoded #1f2937 in grid.tsx
      expect(OG_COLORS.wall).toBe("#1f2937");
    });

    it("has trap color matching grid.tsx", () => {
      // Must match the hardcoded #9ca3af in grid.tsx
      expect(OG_COLORS.trap).toBe("#9ca3af");
    });
  });

  describe("Goal colors", () => {
    it("has default goal color (white)", () => {
      expect(OG_COLORS.goalDefault).toBe("#ffffff");
    });

    it("has default goal border color (gray-300)", () => {
      expect(OG_COLORS.goalDefaultBorder).toBe("#d1d5db");
    });

    it("has visited goal color (green-500)", () => {
      expect(OG_COLORS.goalVisited).toBe("#22c55e");
    });

    it("has visited goal border color (green-600)", () => {
      expect(OG_COLORS.goalVisitedBorder).toBe("#16a34a");
    });
  });

  describe("Agent colors", () => {
    it("has 10 agent colors", () => {
      expect(OG_COLORS.agents).toHaveLength(10);
    });

    it("has blue as first agent color (primary)", () => {
      expect(OG_COLORS.agents[0]).toBe("#3399ff");
    });

    it("all agent colors are valid hex", () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      OG_COLORS.agents.forEach((color, i) => {
        expect(color).toMatch(hexRegex);
      });
    });
  });

  describe("Text colors", () => {
    it("has primary text color", () => {
      expect(OG_COLORS.textPrimary).toBe("#f0f4f8");
    });

    it("has secondary text color", () => {
      expect(OG_COLORS.textSecondary).toBe("#8899a6");
    });
  });
});

describe("OG Grid Constants", () => {
  it("has Herbert specification grid size (25x25)", () => {
    expect(OG_GRID.size).toBe(25);
  });

  it("has appropriate cell size for OG canvas", () => {
    // Cell size should fit grid within OG canvas with margins
    const totalGridSize = OG_GRID.size * OG_GRID.cellSize;
    expect(totalGridSize).toBeLessThan(OG_DIMENSIONS.height - 100);
  });

  it("has grid padding", () => {
    expect(OG_GRID.padding).toBeGreaterThan(0);
  });
});

describe("OG Dimensions", () => {
  it("has standard OG image width (1200px)", () => {
    expect(OG_DIMENSIONS.width).toBe(1200);
  });

  it("has standard OG image height (630px)", () => {
    expect(OG_DIMENSIONS.height).toBe(630);
  });

  it("has correct aspect ratio for social media", () => {
    const ratio = OG_DIMENSIONS.width / OG_DIMENSIONS.height;
    // Standard OG ratio is approximately 1.91:1
    expect(ratio).toBeCloseTo(1.9, 1);
  });
});

describe("Grid calculations", () => {
  it("calculates correct total grid pixel size", () => {
    const totalSize = OG_GRID.size * OG_GRID.cellSize;
    expect(totalSize).toBe(500); // 25 * 20 = 500px
  });

  it("grid fits within OG canvas with comfortable margins", () => {
    const gridSize = OG_GRID.size * OG_GRID.cellSize;
    const horizontalMargin = (OG_DIMENSIONS.width - gridSize) / 2;
    const verticalMargin = (OG_DIMENSIONS.height - gridSize) / 2;

    // Should have at least 50px margin on each side
    expect(horizontalMargin).toBeGreaterThan(50);
    expect(verticalMargin).toBeGreaterThan(50);
  });
});
