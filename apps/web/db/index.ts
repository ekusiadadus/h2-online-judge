import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_SECRET!,
});

export const db = drizzle(client, { schema });
import 'server-only';
