import { pgTable, serial, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Re-export categories from lib for server-side usage
export { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/lib/categories";

export const prelevements = pgTable("prelevements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  day: integer("day").notNull(),
  amount: real("amount").notNull(),
  category: text("category").default("autre").notNull(),
  completed: boolean("completed").default(false).notNull(),
  endDate: timestamp("end_date"),
  totalAmount: real("total_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Prelevement = typeof prelevements.$inferSelect;
export type NewPrelevement = typeof prelevements.$inferInsert;

/** Ligne figée d'un prélèvement dans l'historique d'un mois */
export type SnapshotItem = {
  prelevementId: number;
  title: string;
  category: string;
  day: number;
  amount: number;
  completed: boolean;
  isInstallment: boolean;
};

/**
 * Historique : une ligne par mois clôturé (au passage au mois suivant).
 * Les prélèvements du mois sont figés dans `items` pour que l'historique
 * ne bouge plus si on modifie / supprime un prélèvement ensuite.
 */
export const monthlySnapshots = pgTable("monthly_snapshots", {
  id: serial("id").primaryKey(),
  /** "YYYY-MM" */
  month: text("month").notNull().unique(),
  expenses: real("expenses").notNull(),
  income: real("income").notNull(),
  paid: real("paid").notNull(),
  items: jsonb("items").$type<SnapshotItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Petit stockage clé / valeur (ex : mois courant pour la remise à zéro auto) */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MonthlySnapshot = typeof monthlySnapshots.$inferSelect;
