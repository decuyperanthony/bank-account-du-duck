import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { importRules } from "@/db/schema";

// DELETE : supprime une règle
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getDb().delete(importRules).where(eq(importRules.id, Number(id))).returning();
    if (result.length === 0) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
