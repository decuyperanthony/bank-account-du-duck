import { db } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

// GET all prelevements
export async function GET() {
  try {
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
    const body = await request.json();
    const { title, day, amount } = body;

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
        completed: false,
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
