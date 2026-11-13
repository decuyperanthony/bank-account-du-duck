"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from "@/lib/categories";
import {
  formatEuro,
  getInstallmentInfo,
  isActiveInMonth,
  monthIndexOf,
  toMonthIndex,
  type InstallmentSource,
} from "@/lib/credits";
import { cn } from "@/lib/utils";

type Prelevement = InstallmentSource;

type DayEntry = Prelevement & {
  /** Dernière échéance d'un crédit ce mois-ci */
  isLastInstallment: boolean;
  /** Déjà prélevé (uniquement pertinent pour le mois en cours / passé) */
  isPaid: boolean;
};

const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_TITLE = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const DAY_TITLE = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const compact = (value: number) => {
  const abs = Math.abs(value);
  return abs >= 1000 ? `${(abs / 1000).toFixed(1).replace(".", ",")}k` : Math.round(abs).toString();
};

export default function CalendarPage() {
  const [prelevements, setPrelevements] = useState<Prelevement[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());
  const { isOnline, getCachedPrelevements } = useOfflineSync();

  const fetchData = useCallback(async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/prelevements");
        if (response.ok) {
          setPrelevements(await response.json());
          return;
        }
      }
      setPrelevements(await getCachedPrelevements());
    } catch (error) {
      console.error("Failed to fetch prelevements:", error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCachedPrelevements]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const viewMonth = toMonthIndex(year, month);
  const currentMonth = monthIndexOf(today);
  const isCurrentMonth = viewMonth === currentMonth;

  const data = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay: Record<number, DayEntry[]> = {};

    for (const p of prelevements) {
      // Les crédits n'apparaissent que pendant leurs mois d'échéance
      if (!isActiveInMonth({ ...p, completed: false }, viewMonth)) continue;
      // Un prélèvement du 31 tombe le dernier jour des mois plus courts
      const day = Math.min(Math.max(1, p.day), daysInMonth);
      const info = getInstallmentInfo(p);
      const isPaid =
        viewMonth < currentMonth || (viewMonth === currentMonth && (p.completed || day < today.getDate()));
      (byDay[day] ??= []).push({ ...p, isLastInstallment: info?.lastMonth === viewMonth, isPaid });
    }

    let expenses = 0;
    let income = 0;
    let remaining = 0;
    let maxDay = 0;
    for (const entries of Object.values(byDay)) {
      let dayExpenses = 0;
      for (const e of entries) {
        if (e.amount > 0) {
          expenses += e.amount;
          dayExpenses += e.amount;
          if (!e.isPaid) remaining += e.amount;
        } else {
          income += -e.amount;
        }
      }
      maxDay = Math.max(maxDay, dayExpenses);
    }

    return { firstWeekday, daysInMonth, byDay, expenses, income, remaining, maxDay };
    // today ne change pas pendant la session : on évite de recalculer à chaque rendu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prelevements, year, month, viewMonth, currentMonth]);

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewDate(next);
    const nextIsCurrent = monthIndexOf(next) === currentMonth;
    setSelectedDay(nextIsCurrent ? today.getDate() : null);
  };

  const goToToday = () => {
    setViewDate(new Date());
    setSelectedDay(today.getDate());
  };

  // Agenda : le jour sélectionné, ou tout le mois
  const agenda = useMemo(() => {
    const days = selectedDay
      ? [selectedDay]
      : Object.keys(data.byDay)
          .map(Number)
          .sort((a, b) => a - b);
    return days.map((day) => ({ day, entries: data.byDay[day] ?? [] }));
  }, [data.byDay, selectedDay]);

  if (loading) {
    return (
      <PageLayout activeTab="calendar">
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const paidShare = data.expenses > 0 ? ((data.expenses - data.remaining) / data.expenses) * 100 : 0;

  return (
    <PageLayout activeTab="calendar">
      <div className="mx-auto max-w-lg space-y-4 py-6">
        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold capitalize">{MONTH_TITLE.format(viewDate)}</h1>
          <div className="flex items-center gap-1">
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToToday}
                className="mr-1 rounded-full bg-accent-muted px-3 py-1.5 text-xs font-medium text-accent-primary"
              >
                Aujourd&apos;hui
              </button>
            )}
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mois précédent"
              className="rounded-full p-2 transition-colors hover:bg-bg-tertiary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mois suivant"
              className="rounded-full p-2 transition-colors hover:bg-bg-tertiary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Résumé du mois */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {viewMonth < currentMonth ? "Prélevé ce mois-là" : "Reste à prélever"}
              </p>
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {formatEuro(viewMonth < currentMonth ? data.expenses : data.remaining)}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>
                Sorties <span className="font-medium text-foreground tabular-nums">{formatEuro(data.expenses)}</span>
              </p>
              {data.income > 0 && (
                <p>
                  Entrées <span className="font-medium text-success tabular-nums">+{formatEuro(data.income)}</span>
                </p>
              )}
            </div>
          </div>
          {isCurrentMonth && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
              <div className="h-full rounded-full bg-accent-primary transition-all" style={{ width: `${paidShare}%` }} />
            </div>
          )}
        </div>

        {/* Grille */}
        <div className="rounded-3xl border border-border bg-card p-3">
          <div className="mb-1 grid grid-cols-7">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} className="py-1.5 text-center text-[11px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: data.firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: data.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const entries = data.byDay[day] ?? [];
              const dayExpenses = entries.reduce((s, e) => s + Math.max(0, e.amount), 0);
              const dayIncome = entries.reduce((s, e) => s + Math.max(0, -e.amount), 0);
              const isSelected = selectedDay === day;
              const isToday = isCurrentMonth && day === today.getDate();
              const allPaid = entries.length > 0 && entries.every((e) => e.isPaid);
              const hasLast = entries.some((e) => e.isLastInstallment);
              // Intensité de la case selon le montant du jour (heatmap)
              const intensity = data.maxDay > 0 ? 0.08 + (dayExpenses / data.maxDay) * 0.32 : 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  aria-pressed={isSelected}
                  aria-label={`${day}${entries.length ? ` : ${entries.length} prélèvement(s)` : ""}`}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-start rounded-xl pt-1.5 transition-all",
                    isSelected ? "ring-2 ring-accent-primary" : "hover:bg-bg-tertiary",
                    allPaid && !isSelected && "opacity-50"
                  )}
                  style={
                    dayExpenses > 0
                      ? { backgroundColor: `color-mix(in srgb, var(--accent-primary) ${Math.round(intensity * 100)}%, transparent)` }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-sm font-medium",
                      isToday && "bg-accent-primary text-white"
                    )}
                  >
                    {day}
                  </span>
                  {dayExpenses > 0 && (
                    <span className="mt-0.5 text-[10px] font-semibold tabular-nums leading-none">
                      −{compact(dayExpenses)}
                    </span>
                  )}
                  {dayExpenses === 0 && dayIncome > 0 && (
                    <span className="mt-0.5 text-[10px] font-semibold tabular-nums leading-none text-success">
                      +{compact(dayIncome)}
                    </span>
                  )}
                  {allPaid && <Check className="absolute right-1 top-1 size-3 text-success" />}
                  {hasLast && <Flag className="absolute left-1 top-1 size-3 text-success" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="size-3 text-success" /> Prélevé
            </span>
            <span className="flex items-center gap-1">
              <Flag className="size-3 text-success" /> Dernière échéance
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-accent-primary/40" /> Plus c&apos;est foncé, plus ça sort
            </span>
          </div>
        </div>

        {/* Agenda */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold first-letter:uppercase">
              {selectedDay ? DAY_TITLE.format(new Date(year, month, selectedDay)) : "Tout le mois"}
            </h2>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-xs font-medium text-accent-primary"
              >
                Voir tout le mois
              </button>
            )}
          </div>

          {agenda.every((g) => g.entries.length === 0) ? (
            <p className="text-sm text-muted-foreground">Aucun prélèvement ce jour-là.</p>
          ) : (
            <div className="space-y-4">
              {agenda
                .filter((g) => g.entries.length > 0)
                .map(({ day, entries }) => (
                  <div key={day} className="space-y-1">
                    {!selectedDay && (
                      <p className="text-xs font-medium text-muted-foreground first-letter:uppercase">
                        {DAY_TITLE.format(new Date(year, month, day))}
                      </p>
                    )}
                    {entries.map((p) => {
                      const category = (p.category || "autre") as Category;
                      return (
                        <div key={p.id} className={cn("flex items-center gap-3 py-1.5", p.isPaid && "opacity-60")}>
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[category] }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className={cn("truncate text-sm font-medium", p.isPaid && "line-through")}>
                              {p.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[category]}
                              {p.isLastInstallment && <span className="text-success"> · 🏁 dernière échéance</span>}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              p.amount < 0 && "text-success"
                            )}
                          >
                            {p.amount < 0 ? "+" : "−"}
                            {formatEuro(Math.abs(p.amount), 2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
