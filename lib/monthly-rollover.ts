import { and, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import {
  appMeta,
  monthlySnapshots,
  prelevements,
  type Prelevement,
  type SnapshotItem,
} from "@/db/schema";
import { isActiveInMonth, isInstallment, parseMonthIndex } from "@/lib/credits";

type Db = ReturnType<typeof getDb>;

const CURRENT_MONTH_KEY = "current_month";

/** "YYYY-MM" à l'heure de Paris (le serveur tourne en UTC) */
export const currentMonthKey = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
};

/** Fige les prélèvements actifs d'un mois donné */
export const buildSnapshot = (month: string, list: Prelevement[]) => {
  const monthIdx = parseMonthIndex(month)!;
  const items: SnapshotItem[] = list
    .filter((p) => isActiveInMonth({ ...p, endDate: p.endDate?.toISOString() }, monthIdx))
    .map((p) => ({
      prelevementId: p.id,
      title: p.title,
      category: p.category,
      day: p.day,
      amount: p.amount,
      completed: p.completed,
      isInstallment: isInstallment({ ...p, endDate: p.endDate?.toISOString() }),
    }));
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    month,
    items,
    expenses: round(items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0)),
    income: round(items.filter((i) => i.amount < 0).reduce((s, i) => s - i.amount, 0)),
    paid: round(items.filter((i) => i.amount > 0 && i.completed).reduce((s, i) => s + i.amount, 0)),
  };
};

/**
 * Passage automatique au mois suivant : à la 1ʳᵉ requête d'un nouveau mois,
 * on archive le mois précédent puis on décoche tous les prélèvements.
 * Idempotent et sûr en cas de requêtes concurrentes (compare-and-set sur app_meta).
 */
export const ensureMonthRollover = async (db: Db): Promise<boolean> => {
  const now = currentMonthKey();
  const [row] = await db.select().from(appMeta).where(eq(appMeta.key, CURRENT_MONTH_KEY));

  if (!row) {
    // Premier lancement : on démarre l'historique à partir de ce mois-ci
    await db.insert(appMeta).values({ key: CURRENT_MONTH_KEY, value: now }).onConflictDoNothing();
    return false;
  }
  if (row.value >= now) return false;

  // 1. Archive (sans effet si déjà archivé par une requête concurrente)
  const list = await db.select().from(prelevements);
  await db.insert(monthlySnapshots).values(buildSnapshot(row.value, list)).onConflictDoNothing();

  // 2. Une seule requête "gagne" le passage de mois
  const claimed = await db
    .update(appMeta)
    .set({ value: now, updatedAt: new Date() })
    .where(and(eq(appMeta.key, CURRENT_MONTH_KEY), eq(appMeta.value, row.value)))
    .returning();
  if (claimed.length === 0) return false;

  // 3. Remise à zéro des coches pour le nouveau mois
  await db.update(prelevements).set({ completed: false, updatedAt: new Date() });
  return true;
};
