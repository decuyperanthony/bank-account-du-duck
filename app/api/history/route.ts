import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { monthlySnapshots } from "@/db/schema";

// GET les 24 derniers mois archivés (plus récent en premier)
export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .select()
      .from(monthlySnapshots)
      .orderBy(desc(monthlySnapshots.month))
      .limit(24);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching history:", error);
    // Tables pas encore créées : historique vide plutôt qu'une erreur
    return NextResponse.json([]);
  }
}
