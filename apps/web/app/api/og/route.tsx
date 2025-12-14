/**
 * OG Image Generation API Route
 *
 * Generates dynamic Open Graph images for shared playground states.
 *
 * Query Parameters:
 * - s: Share code (required) - encoded problem/code state
 * - rank: Leaderboard rank (optional) - for solution share
 * - bytes: Code size in bytes (optional) - for solution share
 * - username: User's username (optional) - for solution share
 *
 * @example Problem share:
 * /api/og?s=<shareCode>
 *
 * @example Solution share:
 * /api/og?s=<shareCode>&rank=3&bytes=42&username=ekusiadadus
 */

import { ImageResponse } from "next/og";
import { decodeShareState } from "@/lib/share";
import {
  OG_DIMENSIONS,
  OG_COLORS,
  ProblemShareImage,
  SolutionShareImage,
} from "@/lib/og";
import type { OGProblemData } from "@/lib/og";

export const runtime = "edge";

/**
 * Default problem data when share code is missing or invalid.
 */
const DEFAULT_PROBLEM: OGProblemData = {
  goals: [],
  walls: [],
  traps: [],
  startPosition: { x: 12, y: 12, direction: 0 },
};

/**
 * Fallback OG image when no valid share code is provided.
 */
function FallbackImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
        padding: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: OG_COLORS.primary,
            marginRight: 16,
          }}
        >
          H2
        </span>
        <span
          style={{
            fontSize: 48,
            color: OG_COLORS.textPrimary,
          }}
        >
          Online Judge
        </span>
      </div>

      <div
        style={{
          fontSize: 28,
          color: OG_COLORS.textSecondary,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        Program robots using H2 language
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 20,
          color: OG_COLORS.textMuted,
        }}
      >
        h2-online-judge-web.vercel.app
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const shareCode = searchParams.get("s");
    const rankParam = searchParams.get("rank");
    const bytesParam = searchParams.get("bytes");
    const username = searchParams.get("username");

    // Check if this is a solution share (has rank, bytes, username)
    const isSolutionShare =
      rankParam !== null && bytesParam !== null && username !== null;

    // Decode share state
    let problemData: OGProblemData = DEFAULT_PROBLEM;

    if (shareCode) {
      const result = decodeShareState(shareCode);
      if (result.success && result.state.problem) {
        problemData = {
          goals: result.state.problem.goals,
          walls: result.state.problem.walls,
          traps: result.state.problem.traps,
          startPosition: result.state.problem.startPosition,
          code: result.state.code,
        };
      }
    }

    // Render appropriate image
    let imageElement: React.ReactElement;

    if (!shareCode) {
      // No share code - show fallback
      imageElement = <FallbackImage />;
    } else if (isSolutionShare) {
      // Solution share - show rank and bytes
      const rank = parseInt(rankParam, 10) || 1;
      const bytes = parseInt(bytesParam, 10) || 0;

      imageElement = (
        <SolutionShareImage
          problem={problemData}
          rank={rank}
          bytes={bytes}
          username={username}
        />
      );
    } else {
      // Problem share - show grid only
      imageElement = <ProblemShareImage problem={problemData} />;
    }

    return new ImageResponse(imageElement, {
      ...OG_DIMENSIONS,
      headers: {
        // Cache for 1 hour, stale-while-revalidate for 1 day
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("OG image generation error:", error);

    // Return fallback on error
    return new ImageResponse(<FallbackImage />, {
      ...OG_DIMENSIONS,
      status: 500,
    });
  }
}
