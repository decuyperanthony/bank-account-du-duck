"use client";

import { useEffect, useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Prelevement = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
  endDate?: string | null;
  totalAmount?: number | null;
};

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function CalendarPage() {
  const [prelevements, setPrelevements] = useState<Prelevement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/prelevements");
        const data = await response.json();
        setPrelevements(data);
      } catch (error) {
        console.error("Failed to fetch prelevements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Premier jour du mois (0 = Dimanche, on veut 0 = Lundi)
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6; // Dimanche devient 6

    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Grouper les prélèvements par jour (en filtrant les crédits terminés)
    const prelevementsByDay: Record<number, Prelevement[]> = {};
    const currentMonthDate = new Date(year, month, 1);

    prelevements.forEach(p => {
      const day = p.day;

      // Si le prélèvement a une date de fin, vérifier qu'elle n'est pas dépassée
      if (p.endDate) {
        const endDate = new Date(p.endDate);
        // Ne pas afficher si le mois courant est après le mois de fin
        if (currentMonthDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) {
          return;
        }
      }

      if (day >= 1 && day <= daysInMonth) {
        if (!prelevementsByDay[day]) {
          prelevementsByDay[day] = [];
        }
        prelevementsByDay[day].push({
          ...p,
          category: p.category || "autre"
        });
      }
    });

    return {
      year,
      month,
      startDay,
      daysInMonth,
      prelevementsByDay,
    };
  }, [currentDate, prelevements]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const selectedPrelevements = selectedDay
    ? calendarData.prelevementsByDay[selectedDay] || []
    : [];

  if (loading) {
    return (
      <PageLayout activeTab="calendar">
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="calendar">
      <div className="max-w-lg mx-auto py-6">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-xl font-bold">
            {MONTHS[calendarData.month]} {calendarData.year}
          </h1>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

        {/* Calendrier */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {/* Cases vides avant le premier jour */}
            {Array.from({ length: calendarData.startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Jours du mois */}
            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPrelevements = calendarData.prelevementsByDay[day] || [];
              const hasPrelevements = dayPrelevements.length > 0;
              const isSelected = selectedDay === day;
              const isToday =
                day === new Date().getDate() &&
                calendarData.month === new Date().getMonth() &&
                calendarData.year === new Date().getFullYear();

              const totalAmount = dayPrelevements.reduce((sum, p) => sum + p.amount, 0);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center relative",
                    "transition-all",
                    isSelected && "bg-accent-primary text-white",
                    !isSelected && isToday && "bg-accent-muted",
                    !isSelected && !isToday && hasPrelevements && "bg-bg-tertiary",
                    !isSelected && "hover:bg-bg-tertiary"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && !isSelected && "text-accent-primary"
                  )}>
                    {day}
                  </span>
                  {hasPrelevements && (
                    <div className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2",
                      "flex gap-0.5"
                    )}>
                      {dayPrelevements.length <= 3 ? (
                        dayPrelevements.map((p, idx) => (
                          <div
                            key={idx}
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor: isSelected
                                ? "white"
                                : CATEGORY_COLORS[(p.category || "autre") as Category]
                            }}
                          />
                        ))
                      ) : (
                        <span className={cn(
                          "text-[10px] font-medium",
                          isSelected ? "text-white" : "text-muted-foreground"
                        )}>
                          {dayPrelevements.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail du jour sélectionné */}
        {selectedDay && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold mb-3">
              {selectedDay} {MONTHS[calendarData.month]}
            </h2>
            {selectedPrelevements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun prélèvement ce jour</p>
            ) : (
              <div className="space-y-2">
                {selectedPrelevements.map(p => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between py-2 px-3 rounded-lg",
                      "bg-bg-tertiary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[(p.category || "autre") as Category] }}
                      />
                      <div>
                        <p className={cn(
                          "font-medium text-sm",
                          p.completed && "line-through text-muted-foreground"
                        )}>
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[(p.category || "autre") as Category]}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono font-medium",
                      p.amount >= 0 ? "text-red-400" : "text-green-400"
                    )}>
                      {p.amount >= 0 ? "-" : "+"}{Math.abs(p.amount).toFixed(2)} €
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {selectedPrelevements.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
