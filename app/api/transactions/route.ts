import { and, desc, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bankTransactions } from "@/db/schema";

// GET ?from=YYYY-MM&to=YYYY-MM (to exclu) : opérations importées sur la période
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const month = /^\d{4}-\d{2}$/;
  if (!from || !month.test(from) || (to && !month.test(to))) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  try {
    const conditions = [gte(bankTransactions.date, `${from}-01`)];
    if (to) conditions.push(lt(bankTransactions.date, `${to}-01`));
    const result = await getDb()
      .select()
      .from(bankTransactions)
      .where(and(...conditions))
      .orderBy(desc(bankTransactions.date));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    // Tables pas encore créées : liste vide plutôt qu'une erreur
    return NextResponse.json([]);
  }
}
