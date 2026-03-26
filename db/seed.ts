import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { prelevements } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(prelevements);

  // Add your own prelevements here:
  // await db.insert(prelevements).values([
  //   { title: "Example", day: 1, amount: 10.00, category: "autre" },
  // ]);

  console.log("Done! Database cleared. Add your prelevements via the app.");
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
