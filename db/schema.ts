import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

// Re-export categories from lib for server-side usage
export { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/lib/categories";

export const prelevements = pgTable("prelevements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  day: integer("day").notNull(),
  amount: real("amount").notNull(),
  category: text("category").default("autre").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Prelevement = typeof prelevements.$inferSelect;
export type NewPrelevement = typeof prelevements.$inferInsert;
