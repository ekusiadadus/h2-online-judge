import { sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { problems } from "./problems";
import { tags } from "./tags";

export const problemTags = sqliteTable(
  "problem_tags",
  {
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.problemId, table.tagId] }),
    index("problem_tags_problem_id_idx").on(table.problemId),
    index("problem_tags_tag_id_idx").on(table.tagId),
  ]
);

export type ProblemTag = typeof problemTags.$inferSelect;
