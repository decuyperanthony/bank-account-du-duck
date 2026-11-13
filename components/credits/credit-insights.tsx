"use client";

import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEuro,
  formatMonth,
  getProjection,
  getUpcomingEndings,
  monthIndexOf,
  type InstallmentSource,
} from "@/lib/credits";

/** Frise "ce qui se libère" : prélèvements qui s'arrêtent, mois par mois */
export const EndingsTimeline = ({
  prelevements,
  limit,
}: {
  prelevements: InstallmentSource[];
  limit?: number;
}) => {
  const groups = useMemo(() => getUpcomingEndings(prelevements), [prelevements]);
  const shown = limit ? groups.slice(0, limit) : groups;
  const currentMonth = monthIndexOf(new Date());

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune fin de prélèvement prévue. Ajoute une date de dernière échéance à tes crédits pour
        les voir ici.
      </p>
    );
  }

  let cumulative = 0;
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {shown.map((g) => {
        cumulative += g.freedAmount;
        const inMonths = g.freedMonth - currentMonth;
        return (
          <li key={g.freedMonth} className="relative">
            <span className="absolute -left-[26px] top-1 size-3 rounded-full bg-success ring-4 ring-background" />
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold capitalize">{formatMonth(g.freedMonth)}</p>
              <p className="text-sm font-semibold text-success tabular-nums">
                −{formatEuro(g.freedAmount, 2)}/mois
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {inMonths <= 1 ? "le mois prochain" : `dans ${inMonths} mois`} · cumul libéré{" "}
              {formatEuro(cumulative)}/mois
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {g.items.map(({ p, info }) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="truncate">
                    {p.title}
                    <span className="text-muted-foreground">
                      {" "}
                      · {info.remainingCount} éch. restante{info.remainingCount > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatEuro(p.amount, 2)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
};

/** Barres : total des dépenses fixes prévu sur les prochains mois */
export const ProjectionChart = ({
  prelevements,
  months = 18,
}: {
  prelevements: InstallmentSource[];
  months?: number;
}) => {
  const points = useMemo(() => getProjection(prelevements, months), [prelevements, months]);
  const max = Math.max(1, ...points.map((p) => p.expenses));
  const first = points[0]?.expenses ?? 0;
  const last = points[points.length - 1]?.expenses ?? 0;
  const saved = first - last;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          <p className="text-xl font-bold tabular-nums">{formatEuro(first)}</p>
        </div>
        {saved > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium text-success">
            <TrendingDown className="size-4" />
            {formatEuro(saved)}/mois dans {months - 1} mois
          </div>
        )}
      </div>

      <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Projection des dépenses fixes">
        {points.map((pt, i) => {
          const dropped = i > 0 && pt.expenses < points[i - 1].expenses - 0.01;
          const fixed = pt.expenses - pt.installments;
          return (
            <div
              key={pt.month}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${formatMonth(pt.month)} : ${formatEuro(pt.expenses)} (dont ${formatEuro(pt.installments)} de crédits)`}
            >
              <div
                className={cn("w-full rounded-t-sm bg-accent-primary/80", dropped && "bg-success")}
                style={{ height: `${(pt.installments / max) * 100}%` }}
              />
              <div
                className="w-full bg-muted-foreground/30"
                style={{ height: `${(fixed / max) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground capitalize">
        <span>{formatMonth(points[0].month, true)}</span>
        <span>{formatMonth(points[Math.floor(points.length / 2)].month, true)}</span>
        <span>{formatMonth(points[points.length - 1].month, true)}</span>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent-primary/80" /> Crédits / échéances
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted-foreground/30" /> Autres prélèvements
        </span>
      </div>
    </div>
  );
};
