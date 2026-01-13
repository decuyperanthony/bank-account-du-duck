import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const prelevements = pgTable("prelevements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  day: integer("day").notNull(),
  amount: real("amount").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Prelevement = typeof prelevements.$inferSelect;
export type NewPrelevement = typeof prelevements.$inferInsert;
