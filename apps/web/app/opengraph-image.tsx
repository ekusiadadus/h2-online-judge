import { ImageResponse } from "next/og";

/**
 * Open Graph Image Generator
 *
 * Generates dynamic OG images for social media sharing.
 * Uses Next.js ImageResponse API with Edge runtime.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = "edge";

export const alt = "H2 Online Judge - Program Robots with H2 Language";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        {/* Main Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: "bold",
              color: "#e94560",
              marginRight: "16px",
            }}
          >
            H2
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            Online Judge
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            color: "#a0a0a0",
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          Program robots with simple commands
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#4ade80",
              fontSize: 28,
            }}
          >
            <span style={{ fontSize: 32 }}>s</span>
            <span>forward</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#60a5fa",
              fontSize: 28,
            }}
          >
            <span style={{ fontSize: 32 }}>r</span>
            <span>right</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#f472b6",
              fontSize: 28,
            }}
          >
            <span style={{ fontSize: 32 }}>l</span>
            <span>left</span>
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: 24,
            color: "#6b7280",
          }}
        >
          Rust + WebAssembly | Multi-Agent | Visual Programming
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
