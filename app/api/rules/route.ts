import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { appMeta, IMPORT_RULE_ACTIONS, importRules } from "@/db/schema";
import { DEFAULT_RULES } from "@/lib/bank-import";

const SEEDED_KEY = "import_rules_seeded";

// GET : règles d'import (créées avec les valeurs par défaut au premier appel)
export async function GET() {
  try {
    const db = getDb();
    const [seeded] = await db.select().from(appMeta).where(eq(appMeta.key, SEEDED_KEY));
    if (!seeded) {
      const claimed = await db
        .insert(appMeta)
        .values({ key: SEEDED_KEY, value: "1" })
        .onConflictDoNothing()
        .returning();
      if (claimed.length > 0) await db.insert(importRules).values(DEFAULT_RULES);
    }
    const rules = await db.select().from(importRules).orderBy(asc(importRules.action), asc(importRules.id));
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

const ruleSchema = z.object({
  pattern: z.string().trim().min(2),
  action: z.enum(IMPORT_RULE_ACTIONS),
  label: z.string().trim().min(1),
});

// POST : nouvelle règle
export async function POST(request: Request) {
  const parsed = ruleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rule" }, { status: 400 });
  }
  try {
    const [rule] = await getDb().insert(importRules).values(parsed.data).returning();
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
