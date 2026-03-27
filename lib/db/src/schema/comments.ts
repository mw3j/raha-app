import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => postsTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
