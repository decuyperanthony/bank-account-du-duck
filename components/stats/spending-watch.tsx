"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileUp, ShoppingCart } from "lucide-react";
import { formatEuro, monthIndexOf, monthIndexToInput } from "@/lib/credits";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Tx = { date: string; amount: number; kind: string };

const sum = (list: Tx[], kind: string, month: string) =>
  list.filter((t) => t.kind === kind && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
const count = (list: Tx[], kind: string, month: string) =>
  list.filter((t) => t.kind === kind && t.date.startsWith(month)).length;

const Delta = ({ value, previous }: { value: number; previous: number }) => {
  if (previous === 0) return null;
  const diff = value - previous;
  return (
    <p className={cn("text-xs font-medium", diff <= 0 ? "text-success" : "text-error")}>
      {diff <= 0 ? "▼" : "▲"} {formatEuro(Math.abs(diff))} vs mois dernier
    </p>
  );
};

/** Écarts (MMBILL & co) et dépenses variables (courses), issus des relevés importés */
export const SpendingWatch = () => {
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const current = monthIndexOf(new Date());
  const cur = monthIndexToInput(current);
  const prev = monthIndexToInput(current - 1);

  useEffect(() => {
    fetch(`/api/transactions?from=${prev}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTxs)
      .catch(() => setTxs([]));
  }, [prev]);

  const stats = useMemo(() => {
    const list = txs ?? [];
    return {
      watch: sum(list, "watch", cur),
      watchPrev: sum(list, "watch", prev),
      watchCount: count(list, "watch", cur),
      variable: sum(list, "variable", cur),
      variablePrev: sum(list, "variable", prev),
      variableCount: count(list, "variable", cur),
    };
  }, [txs, cur, prev]);

  if (txs === null) return null;

  if (txs.length === 0) {
    return (
      <Link
        href={ROUTES.IMPORT}
        className="flex items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-5 transition-colors hover:border-accent-primary"
      >
        <FileUp className="size-6 shrink-0 text-accent-primary" />
        <div>
          <p className="font-semibold">Importe ton relevé LCL</p>
          <p className="text-sm text-muted-foreground">
            Pour vérifier les montants et suivre tes écarts 🙈 et tes courses.
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Mes écarts 🙈</p>
        <p className="text-2xl font-bold tabular-nums">{formatEuro(stats.watch)}</p>
        <p className="text-xs text-muted-foreground">
          {stats.watchCount === 0 ? "Rien ce mois-ci, bravo 👏" : `${stats.watchCount} fois ce mois-ci`}
        </p>
        <Delta value={stats.watch} previous={stats.watchPrev} />
      </div>
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShoppingCart className="size-3.5" /> Courses
        </p>
        <p className="text-2xl font-bold tabular-nums">{formatEuro(stats.variable)}</p>
        <p className="text-xs text-muted-foreground">{stats.variableCount} passage(s) ce mois-ci</p>
        <Delta value={stats.variable} previous={stats.variablePrev} />
      </div>
      <Link href={ROUTES.IMPORT} className="col-span-2 text-center text-xs font-medium text-accent-primary">
        Importer un nouveau relevé
      </Link>
    </div>
  );
};
