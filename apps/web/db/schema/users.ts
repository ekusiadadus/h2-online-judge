import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // Auth0 sub
    email: text("email").notNull(),
    name: text("name"),
    /** User-chosen unique username (lowercase, 3-20 chars, alphanumeric + underscore) */
    username: text("username"),
    role: text("role", { enum: ["admin", "user"] })
      .notNull()
      .default("user"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // Case-insensitive unique index on username
    uniqueIndex("users_username_unique_idx").on(table.username),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
