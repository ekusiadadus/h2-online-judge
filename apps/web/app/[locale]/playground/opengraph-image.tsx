import { ImageResponse } from "next/og";
import { decodeShareState } from "@/lib/share";

/**
 * Dynamic Open Graph Image for Playground
 *
 * Generates OG images for shared playground states.
 * Shows code preview and grid configuration when share param is present.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = "edge";

export const alt = "H2 Online Judge Playground";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Image({ searchParams }: Props) {
  const params = await searchParams;
  const shareCode = typeof params.s === "string" ? params.s : undefined;

  // Try to decode share state
  let code = "";
  let goalCount = 0;
  let wallCount = 0;
  let trapCount = 0;

  if (shareCode) {
    const result = decodeShareState(shareCode);
    if (result.success) {
      code = result.state.code;
      if (result.state.problem) {
        goalCount = result.state.problem.goals.length;
        wallCount = result.state.problem.walls.length;
        trapCount = result.state.problem.traps.length;
      }
    }
  }

  // Truncate code for display
  const codeLines = code.split("\n").slice(0, 5);
  const displayCode = codeLines.join("\n");
  const hasMoreLines = code.split("\n").length > 5;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "30px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "#e94560",
                marginRight: "12px",
              }}
            >
              H2
            </span>
            <span
              style={{
                fontSize: 36,
                color: "#ffffff",
              }}
            >
              Playground
            </span>
          </div>

          {/* Problem stats */}
          {(goalCount > 0 || wallCount > 0 || trapCount > 0) && (
            <div
              style={{
                display: "flex",
                gap: "24px",
              }}
            >
              {goalCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#4ade80",
                    fontSize: 24,
                  }}
                >
                  <span style={{ fontSize: 20 }}>●</span>
                  <span>{goalCount} Goals</span>
                </div>
              )}
              {wallCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#6b7280",
                    fontSize: 24,
                  }}
                >
                  <span style={{ fontSize: 20 }}>■</span>
                  <span>{wallCount} Walls</span>
                </div>
              )}
              {trapCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#f59e0b",
                    fontSize: 24,
                  }}
                >
                  <span style={{ fontSize: 20 }}>⚠</span>
                  <span>{trapCount} Traps</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code preview */}
        {code ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "rgba(0, 0, 0, 0.4)",
              borderRadius: "16px",
              padding: "30px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                color: "#e0e0e0",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {displayCode}
              {hasMoreLines && (
                <span style={{ color: "#6b7280" }}>{"\n..."}</span>
              )}
            </div>
          </div>
        ) : (
          // Default view when no share code
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 48,
                color: "#a0a0a0",
                textAlign: "center",
              }}
            >
              Write H2 code to control robots
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#4ade80",
                fontSize: 22,
              }}
            >
              <span style={{ fontWeight: "bold" }}>s</span>
              <span>forward</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#60a5fa",
                fontSize: 22,
              }}
            >
              <span style={{ fontWeight: "bold" }}>r</span>
              <span>right</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#f472b6",
                fontSize: 22,
              }}
            >
              <span style={{ fontWeight: "bold" }}>l</span>
              <span>left</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 20,
              color: "#6b7280",
            }}
          >
            h2-online-judge.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
