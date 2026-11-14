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

/**
 * Règles appliquées à l'import du relevé : le libellé bancaire contient `pattern`
 * → l'opération est ignorée, surveillée (écarts) ou comptée en dépense variable.
 */
export const IMPORT_RULE_ACTIONS = ["ignore", "watch", "variable"] as const;
export type ImportRuleAction = (typeof IMPORT_RULE_ACTIONS)[number];

export const importRules = pgTable("import_rules", {
  id: serial("id").primaryKey(),
  pattern: text("pattern").notNull(),
  action: text("action").$type<ImportRuleAction>().notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Opérations importées depuis un relevé bancaire */
export const TRANSACTION_KINDS = ["matched", "ignore", "watch", "variable", "unknown", "income"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  /** Empreinte date|libellé|montant|n° pour ne pas importer deux fois la même opération */
  hash: text("hash").notNull().unique(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  label: text("label").notNull(),
  /** Convention de l'app : positif = dépense, négatif = rentrée */
  amount: real("amount").notNull(),
  kind: text("kind").$type<TransactionKind>().notNull(),
  /** Libellé de la règle ou du prélèvement rapproché */
  tag: text("tag"),
  prelevementId: integer("prelevement_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ImportRule = typeof importRules.$inferSelect;
export type BankTransaction = typeof bankTransactions.$inferSelect;
