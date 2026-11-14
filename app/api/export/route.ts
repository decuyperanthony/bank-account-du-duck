import { getDb } from "@/db";
import { bankTransactions, importRules, monthlySnapshots, prelevements } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

/** Lit une table optionnelle (absente tant que le schéma n'est pas poussé) */
const safe = async <T,>(query: Promise<T[]>): Promise<T[]> => {
  try {
    return await query;
  } catch {
    return [];
  }
};

// GET export complet (prélèvements, historique, règles, opérations importées) en JSON
export async function GET() {
  try {
    const db = getDb();
    const data = await db
      .select()
      .from(prelevements)
      .orderBy(asc(prelevements.day), asc(prelevements.id));

    const [history, rules, transactions] = await Promise.all([
      safe(db.select().from(monthlySnapshots).orderBy(asc(monthlySnapshots.month))),
      safe(db.select().from(importRules)),
      safe(db.select().from(bankTransactions).orderBy(asc(bankTransactions.date))),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      appName: "Bank Account du Duck",
      version: "2.0.0",
      totalItems: data.length,
      prelevements: data,
      history,
      importRules: rules,
      bankTransactions: transactions,
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
