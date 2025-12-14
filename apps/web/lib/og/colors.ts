/**
 * OG Image Color Constants
 *
 * Exact color values matching the playground design system.
 * Uses dark theme for better social media visibility.
 *
 * All colors derived from globals.css HSL values.
 */

/**
 * Dark theme colors for OG images.
 * Matches .dark theme in globals.css
 */
export const OG_COLORS = {
  // Background colors
  background: "#0c1117", // hsl(207, 35%, 7%)
  card: "#151b24", // hsl(207, 30%, 11%)
  cardBorder: "#29323b", // hsl(207, 20%, 20%)

  // Grid colors
  gridLine: "#2d3640", // hsl(207, 20%, 22%)
  gridCell: "#151b24", // Same as card

  // Element colors (from grid.tsx hardcoded values)
  // Wall made lighter for better visibility in OG images
  wall: "#374151", // gray-700 (more visible than gray-800)
  trap: "#9ca3af", // gray-400

  // Goal colors
  goalDefault: "#ffffff", // white
  goalDefaultBorder: "#d1d5db", // gray-300
  goalVisited: "#22c55e", // green-500
  goalVisitedBorder: "#16a34a", // green-600

  // Agent colors (dark mode)
  agents: [
    "#3399ff", // Agent 0: hsl(207, 100%, 60%) Blue
    "#25c2c2", // Agent 1: hsl(180, 70%, 48%) Cyan
    "#28a878", // Agent 2: hsl(160, 65%, 45%) Teal
    "#28a745", // Agent 3: hsl(142, 65%, 45%) Green
    "#8fcc33", // Agent 4: hsl(80, 60%, 50%) Lime
    "#f5b818", // Agent 5: hsl(45, 90%, 55%) Yellow
    "#f58c30", // Agent 6: hsl(25, 90%, 58%) Orange
    "#e64545", // Agent 7: hsl(0, 75%, 58%) Red
    "#e64591", // Agent 8: hsl(330, 70%, 60%) Pink
    "#9966cc", // Agent 9: hsl(270, 60%, 60%) Purple
  ],

  // Direction indicator
  directionIndicator: "#ffffff",

  // Text colors
  textPrimary: "#f0f4f8", // hsl(207, 15%, 95%)
  textSecondary: "#8899a6", // hsl(207, 12%, 60%)
  textMuted: "#5c6b7a", // muted

  // Accent colors
  primary: "#3ea8ff", // hsl(207, 100%, 62%)
  success: "#28a745", // hsl(142, 65%, 45%)
  warning: "#f5a623", // hsl(38, 85%, 55%)
} as const;

/**
 * Grid dimensions matching playground.
 */
export const OG_GRID = {
  /** Herbert specification: 25x25 grid */
  size: 25,
  /** Cell size in OG image (scaled for 1200x630 canvas) */
  cellSize: 20,
  /** Grid padding inside card */
  padding: 8,
} as const;

/**
 * OG Image dimensions (standard for social media).
 */
export const OG_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;
