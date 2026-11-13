import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { bankTransactions, TRANSACTION_KINDS } from "@/db/schema";

const txSchema = z.object({
  hash: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1).max(500),
  amount: z.number().finite(),
  kind: z.enum(TRANSACTION_KINDS),
  tag: z.string().max(200).nullable(),
  prelevementId: z.number().int().nullable(),
});

const bodySchema = z.object({ transactions: z.array(txSchema).max(5000) });

// POST : enregistre les opérations d'un relevé (les doublons déjà importés sont ignorés)
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { transactions } = parsed.data;
  if (transactions.length === 0) return NextResponse.json({ inserted: 0, duplicates: 0 });

  try {
    const inserted = await getDb()
      .insert(bankTransactions)
      .values(transactions)
      .onConflictDoNothing({ target: bankTransactions.hash })
      .returning({ id: bankTransactions.id });
    return NextResponse.json({
      inserted: inserted.length,
      duplicates: transactions.length - inserted.length,
    });
  } catch (error) {
    console.error("Error importing transactions:", error);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
