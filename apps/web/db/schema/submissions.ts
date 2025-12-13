import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { problems } from "./problems";
import { users } from "./users";

/**
 * Submissions table for storing user solutions to problems.
 * Used for ranking and leaderboard.
 */
export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    /** Status: accepted, wrong_answer, error */
    status: text("status", { enum: ["accepted", "wrong_answer", "error"] })
      .notNull()
      .default("error"),
    /** Number of steps taken to complete (lower is better for ranking) */
    stepCount: integer("step_count"),
    /** Length of code in bytes (lower is better for tiebreaker) */
    codeLength: integer("code_length").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("submissions_problem_id_idx").on(table.problemId),
    index("submissions_user_id_idx").on(table.userId),
    index("submissions_problem_status_idx").on(table.problemId, table.status),
  ]
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

/**
 * Relations for submissions table.
 */
export const submissionsRelations = relations(submissions, ({ one }) => ({
  problem: one(problems, {
    fields: [submissions.problemId],
    references: [problems.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));
