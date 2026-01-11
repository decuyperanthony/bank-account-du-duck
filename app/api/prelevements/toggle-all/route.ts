import { db } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";

// POST toggle all prelevements completed status
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { completed } = body;

    if (completed === undefined) {
      return NextResponse.json(
        { error: "Missing required field: completed" },
        { status: 400 }
      );
    }

    await db
      .update(prelevements)
      .set({ completed, updatedAt: new Date() });

    const result = await db.select().from(prelevements);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling prelevements:", error);
    return NextResponse.json(
      { error: "Failed to toggle prelevements" },
      { status: 500 }
    );
  }
}
