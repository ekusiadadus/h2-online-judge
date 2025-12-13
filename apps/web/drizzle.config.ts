import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    // Map existing env names to Turso expected names
    url: process.env.TURSO_DATABASE_URL ?? process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_SECRET!,
  },
});
