"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type Category,
  CATEGORIES
} from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Plus,
  Check,
  ShoppingCart,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Prelevement = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
};

type CategoryStats = {
  category: Category;
  label: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
  items: Prelevement[];
};

export default function StatsPage() {
  const [prelevements, setPrelevements] = useState<Prelevement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);

  // Quick add forms
  const [showSalaryInput, setShowSalaryInput] = useState(false);
  const [salaryTitle, setSalaryTitle] = useState("Salaire");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");

  const [showCoursesInput, setShowCoursesInput] = useState(false);
  const [coursesTitle, setCoursesTitle] = useState("Courses");
  const [coursesAmount, setCoursesAmount] = useState("");
  const [coursesDay, setCoursesDay] = useState("1");

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/prelevements");
      const data = await response.json();
      setPrelevements(data);
    } catch (error) {
      console.error("Failed to fetch prelevements:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addQuickPrelevement = async (
    title: string,
    amount: number,
    day: number,
    category: string
  ) => {
    try {
      const response = await fetch("/api/prelevements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, day, category }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to add prelevement:", error);
    }
  };

  const handleAddSalary = async () => {
    const amount = Number.parseFloat(salaryAmount);
    const day = Number.parseInt(salaryDay);
    if (!salaryTitle.trim() || isNaN(amount) || amount <= 0 || isNaN(day)) return;

    await addQuickPrelevement(salaryTitle.trim(), -amount, day, "revenu");
    setSalaryAmount("");
    setSalaryTitle("Salaire");
    setSalaryDay("1");
    setShowSalaryInput(false);
  };

  const handleAddCourses = async () => {
    const amount = Number.parseFloat(coursesAmount);
    const day = Number.parseInt(coursesDay);
    if (!coursesTitle.trim() || isNaN(amount) || amount <= 0 || isNaN(day)) return;

    await addQuickPrelevement(coursesTitle.trim(), amount, day, "courses");
    setCoursesAmount("");
    setCoursesTitle("Courses");
    setCoursesDay("1");
    setShowCoursesInput(false);
  };

  const stats = useMemo(() => {
    const withCategory = prelevements.map(p => ({
      ...p,
      category: p.category || "autre"
    }));

    const depenses = withCategory.filter(p => p.amount > 0);
    const revenus = withCategory.filter(p => p.amount < 0);

    const totalDepenses = depenses.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenus = Math.abs(revenus.reduce((sum, p) => sum + p.amount, 0));
    const solde = totalRevenus - totalDepenses;

    const categoryStats: CategoryStats[] = CATEGORIES
      .filter(cat => cat !== "revenu")
      .map(category => {
        const items = depenses.filter(p => p.category === category);
        const total = items.reduce((sum, p) => sum + p.amount, 0);
        return {
          category,
          label: CATEGORY_LABELS[category],
          color: CATEGORY_COLORS[category],
          total,
          count: items.length,
          percentage: totalDepenses > 0 ? (total / totalDepenses) * 100 : 0,
          items,
        };
      })
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.total - a.total);

    return {
      totalDepenses,
      totalRevenus,
      solde,
      categoryStats,
      revenus,
    };
  }, [prelevements]);

  if (loading) {
    return (
      <PageLayout activeTab="stats">
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="stats">
      <div className="max-w-lg mx-auto py-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold">Statistiques</h1>

        {/* Reste à vivre - Hero card */}
        <div
          className={cn(
            "relative overflow-hidden p-6",
            "bg-card rounded-2xl",
            "border border-border",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 opacity-10",
              stats.solde >= 0
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-red-500 to-rose-600"
            )}
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "flex items-center justify-center",
                  "size-12 rounded-full",
                  stats.solde >= 0 ? "bg-green-500/20" : "bg-red-500/20"
                )}
              >
                <Wallet className={cn("size-6", stats.solde >= 0 ? "text-green-400" : "text-red-400")} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reste à vivre</p>
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  stats.solde >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {stats.solde >= 0 ? "+" : ""}{stats.solde.toFixed(2)} €
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
              <span>Revenus: <span className="text-green-400 font-medium">{stats.totalRevenus.toFixed(2)} €</span></span>
              <span>Dépenses: <span className="text-red-400 font-medium">{stats.totalDepenses.toFixed(2)} €</span></span>
            </div>
          </div>
        </div>

        {/* Quick Actions: Salary & Courses */}
        <div className="grid grid-cols-2 gap-3">
          {/* Salary Quick Add */}
          <div className={cn("bg-card rounded-xl border border-border overflow-hidden")}>
            <button
              type="button"
              onClick={() => setShowSalaryInput(!showSalaryInput)}
              className="w-full p-4 flex items-center gap-3 hover:bg-bg-tertiary/50 transition-colors"
            >
              <div className="flex items-center justify-center size-10 rounded-full bg-green-500/20">
                <Banknote className="size-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Salaire</p>
                {stats.revenus.length > 0 ? (
                  <p className="text-xs text-green-400 font-medium">
                    +{stats.totalRevenus.toFixed(0)} €
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Ajouter</p>
                )}
              </div>
              {showSalaryInput ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <Plus className="size-4 text-muted-foreground" />
              )}
            </button>
            {showSalaryInput && (
              <div className="border-t border-border p-3 space-y-2">
                <Input
                  placeholder="Titre (ex: Salaire)"
                  value={salaryTitle}
                  onChange={(e) => setSalaryTitle(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Montant net"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Jour"
                  value={salaryDay}
                  onChange={(e) => setSalaryDay(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button onClick={handleAddSalary} size="sm" className="w-full h-8 text-sm">
                  <Check className="size-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            )}
          </div>

          {/* Courses Quick Add */}
          <div className={cn("bg-card rounded-xl border border-border overflow-hidden")}>
            <button
              type="button"
              onClick={() => setShowCoursesInput(!showCoursesInput)}
              className="w-full p-4 flex items-center gap-3 hover:bg-bg-tertiary/50 transition-colors"
            >
              <div className="flex items-center justify-center size-10 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS.courses}20` }}>
                <ShoppingCart className="size-5" style={{ color: CATEGORY_COLORS.courses }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Courses</p>
                {(() => {
                  const coursesItems = prelevements.filter(p => p.category === "courses");
                  const coursesTotal = coursesItems.reduce((sum, p) => sum + p.amount, 0);
                  return coursesItems.length > 0 ? (
                    <p className="text-xs font-medium" style={{ color: CATEGORY_COLORS.courses }}>
                      {coursesTotal.toFixed(0)} €
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ajouter</p>
                  );
                })()}
              </div>
              {showCoursesInput ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <Plus className="size-4 text-muted-foreground" />
              )}
            </button>
            {showCoursesInput && (
              <div className="border-t border-border p-3 space-y-2">
                <Input
                  placeholder="Titre (ex: Courses Leclerc)"
                  value={coursesTitle}
                  onChange={(e) => setCoursesTitle(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Budget mensuel"
                  value={coursesAmount}
                  onChange={(e) => setCoursesAmount(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Jour"
                  value={coursesDay}
                  onChange={(e) => setCoursesDay(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button onClick={handleAddCourses} size="sm" className="w-full h-8 text-sm">
                  <Check className="size-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            icon={<TrendingDown className="size-5" />}
            iconBg="bg-red-500/20"
            iconColor="text-red-400"
            label="Dépenses"
            value={stats.totalDepenses}
            valueColor="text-red-400"
          />
          <SummaryCard
            icon={<TrendingUp className="size-5" />}
            iconBg="bg-green-500/20"
            iconColor="text-green-400"
            label="Revenus"
            value={stats.totalRevenus}
            valueColor="text-green-400"
          />
        </div>

        {/* Pie Chart Section */}
        {stats.categoryStats.length > 0 && (
          <div
            className={cn(
              "p-4",
              "bg-card rounded-xl",
              "border border-border"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-accent-primary" />
              <h2 className="font-semibold">Répartition des dépenses</h2>
            </div>

            <div className="flex items-center gap-6">
              <div
                className="size-32 rounded-full flex-shrink-0"
                style={{
                  background: generateConicGradient(stats.categoryStats),
                }}
              />
              <div className="flex-1 space-y-2">
                {stats.categoryStats.slice(0, 6).map(stat => (
                  <div key={stat.category} className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {stat.label}
                    </span>
                    <span className="text-sm font-medium">
                      {stat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div>
          <h2 className="font-semibold mb-4">Détail par catégorie</h2>
          <div className="flex flex-col gap-3">
            {stats.categoryStats.map(stat => (
              <CategoryCard
                key={stat.category}
                stat={stat}
                isExpanded={expandedCategory === stat.category}
                onToggle={() => setExpandedCategory(
                  expandedCategory === stat.category ? null : stat.category
                )}
              />
            ))}

            {/* Revenus section */}
            {stats.revenus.length > 0 && (
              <RevenusCard revenus={stats.revenus} totalRevenus={stats.totalRevenus} />
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Helper function to generate conic gradient for pie chart
function generateConicGradient(stats: CategoryStats[]): string {
  if (stats.length === 0) return "#374151";

  let currentAngle = 0;
  const gradientParts = stats.map(stat => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + (stat.percentage * 3.6);
    currentAngle = endAngle;
    return `${stat.color} ${startAngle}deg ${endAngle}deg`;
  });

  return `conic-gradient(${gradientParts.join(", ")})`;
}

// Summary Card Component
type SummaryCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  valueColor: string;
};

function SummaryCard({ icon, iconBg, iconColor, label, value, valueColor }: SummaryCardProps) {
  return (
    <div
      className={cn(
        "p-4",
        "bg-card rounded-xl",
        "border border-border"
      )}
    >
      <div className={cn("flex items-center justify-center size-10 rounded-full mb-3", iconBg, iconColor)}>
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-bold", valueColor)}>
        {value.toFixed(2)} €
      </p>
    </div>
  );
}

// Revenus Card Component
function RevenusCard({ revenus, totalRevenus }: { revenus: Prelevement[]; totalRevenus: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-card rounded-xl",
        "border border-border",
        "overflow-hidden"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-bg-tertiary/50 transition-colors"
      >
        <div
          className="size-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${CATEGORY_COLORS.revenu}20` }}
        >
          <TrendingUp className="size-5" style={{ color: CATEGORY_COLORS.revenu }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium">{CATEGORY_LABELS.revenu}</p>
          <p className="text-sm text-muted-foreground">
            {revenus.length} entrée{revenus.length > 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-lg font-semibold text-green-400">
          +{totalRevenus.toFixed(2)} €
        </p>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          <div className="pt-3 space-y-2">
            {revenus.map(item => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.title}</span>
                <span className="text-sm font-medium text-green-400">
                  +{Math.abs(item.amount).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Category Card Component
type CategoryCardProps = {
  stat: CategoryStats;
  isExpanded: boolean;
  onToggle: () => void;
};

function CategoryCard({ stat, isExpanded, onToggle }: CategoryCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl",
        "border border-border",
        "overflow-hidden"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-bg-tertiary/50 transition-colors"
      >
        <div
          className="size-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${stat.color}20` }}
        >
          <div
            className="size-4 rounded-full"
            style={{ backgroundColor: stat.color }}
          />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium">{stat.label}</p>
          <p className="text-sm text-muted-foreground">
            {stat.count} prélèvement{stat.count > 1 ? "s" : ""} • {stat.percentage.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">
            {stat.total.toFixed(2)} €
          </p>
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 pb-4">
          <div className="pt-3 space-y-2">
            {stat.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.title}</span>
                <span className="text-sm font-medium">{item.amount.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
