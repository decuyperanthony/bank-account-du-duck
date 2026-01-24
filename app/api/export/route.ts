import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

// GET export all prelevements as JSON
export async function GET() {
  try {
    const db = getDb();
    const data = await db
      .select()
      .from(prelevements)
      .orderBy(asc(prelevements.day), asc(prelevements.id));

    const exportData = {
      exportedAt: new Date().toISOString(),
      appName: "Bank Account du Duck",
      version: "0.1.0",
      totalItems: data.length,
      prelevements: data,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
