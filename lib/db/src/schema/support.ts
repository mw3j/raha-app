import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

export const ticketTypeEnum = pgEnum("ticket_type", ["bug", "suggestion", "question", "other"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  type: ticketTypeEnum("type").default("other").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  adminNote: text("admin_note"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTicketsTable.$inferSelect;
