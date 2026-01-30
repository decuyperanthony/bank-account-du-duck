import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { prelevements } from "./schema";
import { defaultPrelevements } from "./default-prelevements";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(prelevements);

  // Insert seed data
  await db.insert(prelevements).values(defaultPrelevements);

  console.log(`Seeded ${defaultPrelevements.length} prelevements`);
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
