import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// PUT update prelevement
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const { title, day, amount, completed, endDate, totalAmount } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (day !== undefined) updateData.day = Number(day);
    if (amount !== undefined) updateData.amount = Number(amount);
    if (completed !== undefined) updateData.completed = completed;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount ? Number(totalAmount) : null;

    const result = await db
      .update(prelevements)
      .set(updateData)
      .where(eq(prelevements.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Prelevement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating prelevement:", error);
    return NextResponse.json(
      { error: "Failed to update prelevement" },
      { status: 500 }
    );
  }
}

// DELETE prelevement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const result = await db
      .delete(prelevements)
      .where(eq(prelevements.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Prelevement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prelevement:", error);
    return NextResponse.json(
      { error: "Failed to delete prelevement" },
      { status: 500 }
    );
  }
}
