"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEuro,
  formatMonth,
  isActiveInMonth,
  monthIndexOf,
  parseMonthIndex,
  type InstallmentSource,
} from "@/lib/credits";

type SnapshotItem = { day: number; amount: number; completed: boolean };
type Snapshot = { month: string; expenses: number; income: number; paid: number; items: SnapshotItem[] };

type DayItem = { day: number; amount: number };

/** Dépenses cumulées jour par jour (index 0 = jour 1) */
const cumulative = (items: DayItem[], days: number): number[] => {
  const perDay = new Array(days).fill(0);
  for (const i of items) {
    if (i.amount <= 0) continue;
    perDay[Math.min(Math.max(1, i.day), days) - 1] += i.amount;
  }
  let total = 0;
  return perDay.map((v) => (total += v));
};

const toPath = (values: number[], days: number, max: number, w: number, h: number) =>
  values
    .map((v, i) => {
      const x = (i / (days - 1)) * w;
      const y = h - (v / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

const W = 300;
const H = 120;

export const MonthComparison = ({ prelevements }: { prelevements: InstallmentSource[] }) => {
  const [history, setHistory] = useState<Snapshot[] | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  const now = new Date();
  const today = now.getDate();
  const currentMonth = monthIndexOf(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const data = useMemo(() => {
    const active = prelevements.filter((p) => isActiveInMonth({ ...p, completed: false }, currentMonth));
    const current = cumulative(active, daysInMonth);
    const previousSnap = history?.find((s) => parseMonthIndex(s.month) === currentMonth - 1);
    const previous = previousSnap ? cumulative(previousSnap.items, daysInMonth) : null;

    const spentSoFar = current[today - 1];
    const previousSameDay = previous ? previous[today - 1] : null;
    const max = Math.max(1, current[daysInMonth - 1], previous?.[daysInMonth - 1] ?? 0) * 1.08;

    return { current, previous, spentSoFar, previousSameDay, max, total: current[daysInMonth - 1] };
  }, [prelevements, history, currentMonth, daysInMonth, today]);

  const delta = data.previousSameDay !== null ? data.spentSoFar - data.previousSameDay : null;
  const pastPart = data.current.slice(0, today);
  const futurePart = data.current.map((v, i) => (i < today - 1 ? null : v));
  const dotX = ((today - 1) / (daysInMonth - 1)) * W;
  const dotY = H - (data.spentSoFar / data.max) * H;

  // Barres : 5 derniers mois archivés + mois en cours (prévu)
  const bars = useMemo(() => {
    const past = (history ?? [])
      .slice(0, 5)
      .reverse()
      .map((s) => ({ month: parseMonthIndex(s.month)!, value: s.expenses, current: false }));
    return [...past, { month: currentMonth, value: data.total, current: true }];
  }, [history, currentMonth, data.total]);
  const barMax = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="space-y-4">
      {/* Courbe du mois */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="p-5 pb-2">
          <p className="text-sm text-muted-foreground">Prélevé ce mois-ci</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">{formatEuro(data.spentSoFar)}</p>
          {delta !== null ? (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-sm font-medium",
                delta <= 0 ? "text-success" : "text-error"
              )}
            >
              {delta <= 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
              {formatEuro(Math.abs(delta))}
              <span className="font-normal text-muted-foreground">vs le mois dernier à la même date</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              sur {formatEuro(data.total)} prévus ce mois-ci
            </p>
          )}
        </div>

        <div className="relative px-0 pt-2">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-36 w-full" aria-hidden>
            {[0.25, 0.5, 0.75].map((r) => (
              <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {data.previous && (
              <path
                d={toPath(data.previous, daysInMonth, data.max, W, H)}
                fill="none"
                className="stroke-muted-foreground/50"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {/* Reste du mois (prévu) en pointillés */}
            <path
              d={toPath(futurePart.map((v) => v ?? 0), daysInMonth, data.max, W, H)
                .split(" ")
                .slice(today - 1)
                .join(" ")
                .replace(/^L/, "M")}
              fill="none"
              className="stroke-accent-primary/50"
              strokeWidth={2}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`${toPath(pastPart, daysInMonth, data.max, W, H)} L${dotX},${H} L0,${H} Z`}
              className="fill-accent-primary/10"
            />
            <path
              d={toPath(pastPart, daysInMonth, data.max, W, H)}
              fill="none"
              className="stroke-accent-primary"
              strokeWidth={2.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Point "aujourd'hui" (en HTML pour rester rond malgré preserveAspectRatio) */}
          <span
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-accent-primary"
            style={{ left: `${(dotX / W) * 100}%`, top: `calc(0.5rem + ${(dotY / H) * 9}rem)` }}
          />
        </div>

        <div className="flex items-center justify-between px-5 pb-4 pt-2 text-xs text-muted-foreground">
          <span>1</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded bg-accent-primary" /> Ce mois-ci
            </span>
            {data.previous && (
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded bg-muted-foreground/50" /> Mois dernier
              </span>
            )}
          </span>
          <span>{daysInMonth}</span>
        </div>
      </div>

      {/* Historique mensuel */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Historique</h2>
        {history !== null && history.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            L&apos;historique démarre maintenant : chaque mois sera archivé automatiquement le 1ᵉʳ
            du mois suivant, et les coches remises à zéro.
          </p>
        )}
        <div className="flex h-28 items-end gap-2">
          {bars.map((b) => (
            <div key={b.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {Math.round(b.value)}
              </span>
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-lg",
                  b.current ? "bg-accent-primary/40 outline-dashed outline-1 outline-accent-primary" : "bg-accent-primary"
                )}
                style={{ height: `${(b.value / barMax) * 75}%` }}
                title={`${formatMonth(b.month)} : ${formatEuro(b.value)}`}
              />
              <span className="text-[10px] capitalize text-muted-foreground">
                {formatMonth(b.month, true).split(" ")[0]}
              </span>
            </div>
          ))}
        </div>

        {history && history.length > 0 && (
          <ul className="mt-4 divide-y divide-border">
            {history.slice(0, 6).map((s) => {
              const idx = parseMonthIndex(s.month)!;
              const unpaid = s.items.filter((i) => i.amount > 0 && !i.completed).length;
              return (
                <li key={s.month} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium capitalize">{formatMonth(idx)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.items.length} prélèvements
                      {unpaid > 0 && ` · ${unpaid} non cochés`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">−{formatEuro(s.expenses)}</p>
                    {s.income > 0 && (
                      <p className="text-xs text-success tabular-nums">+{formatEuro(s.income)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
