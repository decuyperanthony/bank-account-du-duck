// Catégories disponibles pour les prélèvements
export const CATEGORIES = [
  "telecom",
  "logement",
  "streaming",
  "assurance",
  "transport",
  "credit",
  "impot",
  "courses",
  "revenu",
  "autre",
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
  courses: "Courses",
  revenu: "Revenus",
  autre: "Autre",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  telecom: "#3b82f6",
  logement: "#f59e0b",
  streaming: "#8b5cf6",
  assurance: "#10b981",
  transport: "#ec4899",
  credit: "#ef4444",
  impot: "#6b7280",
  courses: "#f97316",
  revenu: "#22c55e",
  autre: "#64748b",
};
