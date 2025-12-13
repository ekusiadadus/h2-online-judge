import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const problems = sqliteTable(
  "problems",
  {
    id: text("id").primaryKey(), // UUID
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] })
      .notNull()
      .default("easy"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    gridSize: integer("grid_size").notNull().default(25),
    startPositionJson: text("start_position_json").notNull(), // JSON: {x, y, direction}
    goalsJson: text("goals_json").notNull().default("[]"), // JSON: [{x, y}]
    wallsJson: text("walls_json").notNull().default("[]"), // JSON: [{x, y}]
    trapsJson: text("traps_json").notNull().default("[]"), // JSON: [{x, y}]
    sampleCode: text("sample_code").notNull().default(""),
    maxSteps: integer("max_steps").notNull().default(1000),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("problems_is_public_created_at_idx").on(
      table.isPublic,
      table.createdAt
    ),
    index("problems_author_id_created_at_idx").on(
      table.authorId,
      table.createdAt
    ),
  ]
);

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
