import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";

// POST reset prelevements — clears all data
export async function POST() {
  try {
    const db = getDb();
    await db.delete(prelevements);

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error resetting prelevements:", error);
    return NextResponse.json(
      { error: "Failed to reset prelevements" },
      { status: 500 }
    );
  }
}
