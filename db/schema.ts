import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

// Catégories disponibles pour les prélèvements
export const CATEGORIES = [
  "telecom",     // Téléphonie, internet
  "logement",    // Loyer, charges, EDF
  "streaming",   // Netflix, Canal+, Spotify
  "assurance",   // MAIF, mutuelles
  "transport",   // Crédit voiture, scooter
  "credit",      // Crédits conso
  "impot",       // Impôts
  "revenu",      // CAF, salaire
  "autre",       // Autres
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  telecom: "Télécom",
  logement: "Logement",
  streaming: "Streaming",
  assurance: "Assurance",
  transport: "Transport",
  credit: "Crédit",
  impot: "Impôts",
  revenu: "Revenus",
  autre: "Autre",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  telecom: "#3b82f6",    // blue
  logement: "#f59e0b",   // amber
  streaming: "#8b5cf6",  // violet
  assurance: "#10b981",  // emerald
  transport: "#ec4899",  // pink
  credit: "#ef4444",     // red
  impot: "#6b7280",      // gray
  revenu: "#22c55e",     // green
  autre: "#64748b",      // slate
};

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
