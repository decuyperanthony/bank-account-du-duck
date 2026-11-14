import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { ensureMonthRollover } from "@/lib/monthly-rollover";

// GET all prelevements
export async function GET() {
  try {
    const db = getDb();
    // Nouveau mois ? On archive le précédent et on décoche tout.
    // Ne doit jamais casser la liste (ex : tables d'historique pas encore créées).
    try {
      await ensureMonthRollover(db);
    } catch (error) {
      console.error("Month rollover failed:", error);
    }
    const result = await db
      .select()
      .from(prelevements)
      .orderBy(asc(prelevements.day), asc(prelevements.id));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching prelevements:", error);
    return NextResponse.json(
      { error: "Failed to fetch prelevements" },
      { status: 500 }
    );
  }
}

// POST create new prelevement
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, day, amount, category, endDate, totalAmount } = body;

    if (!title || day === undefined || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, day, amount" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(prelevements)
      .values({
        title,
        day: Number(day),
        amount: Number(amount),
        category: category || "autre",
        completed: false,
        endDate: endDate ? new Date(endDate) : null,
        totalAmount: totalAmount ? Number(totalAmount) : null,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating prelevement:", error);
    return NextResponse.json(
      { error: "Failed to create prelevement" },
      { status: 500 }
    );
  }
}
