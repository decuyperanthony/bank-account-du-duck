import { getDb } from "@/db";
import { prelevements } from "@/db/schema";
import { NextResponse } from "next/server";

const defaultPrelevements = [
  // Jour 2
  { title: "SFR", day: 2, amount: 33.99, completed: false },
  // Jour 4
  { title: "SFR", day: 4, amount: 1.99, completed: false },
  { title: "Canal +", day: 4, amount: 45.99, completed: false },
  { title: "Amazon Prime", day: 4, amount: 6.99, completed: false },
  { title: "Dyson => 04/02/2026", day: 4, amount: 57.96, completed: false },
  // Jour 5
  { title: "SFR", day: 5, amount: 38.98, completed: false },
  { title: "CAF", day: 5, amount: -75.53, completed: false },
  { title: "Scooter", day: 5, amount: 166.59, completed: false },
  { title: "Canapé => 04/12/2026", day: 5, amount: 185.09, completed: false },
  { title: "EDF", day: 5, amount: 125.12, completed: false },
  // Jour 6
  { title: "SFR", day: 6, amount: 11.96, completed: false },
  { title: "L'equipe", day: 6, amount: 3.99, completed: false },
  // Jour 7
  { title: "MAIF", day: 7, amount: 102.44, completed: false },
  // Jour 10
  { title: "Apple 2TO", day: 10, amount: 9.99, completed: false },
  { title: "Loyer", day: 10, amount: 1100.0, completed: false },
  // Jour 16
  { title: "Impot", day: 16, amount: 27.0, completed: false },
  // Jour 21
  { title: "Apple minis => 21/06/2026", day: 21, amount: 56.91, completed: false },
  // Jour 23
  { title: "Ligue 1+", day: 23, amount: 12.99, completed: false },
  // Jour 26
  { title: "Apple Music Family", day: 26, amount: 16.99, completed: false },
];

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
