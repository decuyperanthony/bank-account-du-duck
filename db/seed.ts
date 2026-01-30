import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { prelevements } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const seedData = [
  // Jour 2
  { title: "SFR", day: 2, amount: 33.99, category: "telecom", completed: false },
  // Jour 4
  { title: "SFR", day: 4, amount: 1.99, category: "telecom", completed: false },
  { title: "Canal +", day: 4, amount: 45.99, category: "streaming", completed: false },
  { title: "Amazon Prime", day: 4, amount: 6.99, category: "streaming", completed: false },
  { title: "Dyson => 04/02/2026", day: 4, amount: 57.96, category: "credit", completed: false },
  // Jour 5
  { title: "SFR", day: 5, amount: 38.98, category: "telecom", completed: false },
  { title: "CAF", day: 5, amount: -75.53, category: "revenu", completed: false },
  { title: "Scooter", day: 5, amount: 166.59, category: "transport", completed: false },
  { title: "EDF", day: 5, amount: 125.12, category: "logement", completed: false },
  // Jour 6
  { title: "SFR", day: 6, amount: 11.96, category: "telecom", completed: false },
  { title: "L'equipe", day: 6, amount: 3.99, category: "streaming", completed: false },
  // Jour 7
  { title: "MAIF", day: 7, amount: 102.44, category: "assurance", completed: false },
  // Jour 10
  { title: "Apple 2TO", day: 10, amount: 9.99, category: "streaming", completed: false },
  { title: "Loyer", day: 10, amount: 1100.0, category: "logement", completed: false },
  // Jour 16
  { title: "Impot", day: 16, amount: 27.0, category: "impot", completed: false },
  // Jour 21
  { title: "Apple minis => 21/06/2026", day: 21, amount: 56.91, category: "credit", completed: false },
  // Jour 23
  { title: "Ligue 1+", day: 23, amount: 12.99, category: "streaming", completed: false },
  // Jour 26
  { title: "Apple Music Family", day: 26, amount: 16.99, category: "streaming", completed: false },
];

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(prelevements);

  // Insert seed data
  await db.insert(prelevements).values(seedData);

  console.log(`Seeded ${seedData.length} prelevements`);
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
