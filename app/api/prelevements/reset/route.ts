import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { defaultPrelevements } from "@/db/default-prelevements";
import { NextResponse } from "next/server";

// POST reset prelevements to defaults
export async function POST() {
  try {
    const db = getDb();
    // Delete all existing prelevements
    await db.delete(prelevements);

    // Insert default prelevements
    const result = await db.insert(prelevements).values(defaultPrelevements).returning();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting prelevements:", error);
    return NextResponse.json(
      { error: "Failed to reset prelevements" },
      { status: 500 }
    );
  }
}
