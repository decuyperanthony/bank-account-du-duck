import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET database connection status
export async function GET() {
  try {
    const db = getDb();
    // Simple query to check connection
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ connected: false });
  }
}
