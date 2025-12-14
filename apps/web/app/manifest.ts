import type { MetadataRoute } from "next";

/**
 * Web App Manifest for PWA support
 * Provides app metadata for installation and display
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H2 Online Judge",
    short_name: "H2OJ",
    description:
      "H2 Online Judge - A code golf game for the Herbert programming language",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f18",
    theme_color: "#00d4ff",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/h2-logo-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/h2-logo-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["education", "games", "productivity"],
    lang: "ja",
    dir: "ltr",
  };
}
