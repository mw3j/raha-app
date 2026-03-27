import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const readingProgressTable = pgTable("reading_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull().unique(),
  lastSurah: integer("last_surah").default(1).notNull(),
  lastVerse: integer("last_verse").default(1).notNull(),
  completedSurahs: integer("completed_surahs").array().default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReadingProgressSchema = createInsertSchema(readingProgressTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type ReadingProgress = typeof readingProgressTable.$inferSelect;
