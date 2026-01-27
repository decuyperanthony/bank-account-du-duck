"use client";

import { useEffect, useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type Category,
  CATEGORIES
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";

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

  const stats = useMemo(() => {
    // Séparer dépenses et revenus
    const depenses = prelevements.filter(p => p.amount > 0);
    const revenus = prelevements.filter(p => p.amount < 0);

    const totalDepenses = depenses.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenus = Math.abs(revenus.reduce((sum, p) => sum + p.amount, 0));
    const solde = totalRevenus - totalDepenses;

    // Stats par catégorie (uniquement dépenses pour le camembert)
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
      <div className="max-w-lg mx-auto py-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold mb-6">Statistiques</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Dépenses */}
          <SummaryCard
            icon={<TrendingDown className="size-5" />}
            iconBg="bg-red-500/20"
            iconColor="text-red-400"
            label="Dépenses"
            value={stats.totalDepenses}
            valueColor="text-red-400"
          />

          {/* Total Revenus */}
          <SummaryCard
            icon={<TrendingUp className="size-5" />}
            iconBg="bg-green-500/20"
            iconColor="text-green-400"
            label="Revenus"
            value={stats.totalRevenus}
            valueColor="text-green-400"
          />
        </div>

        {/* Solde Card */}
        <div
          className={cn(
            "flex items-center gap-4 p-4 mb-6",
            "bg-card rounded-xl",
            "border border-border"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center",
              "size-12 rounded-full",
              stats.solde >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            )}
          >
            <Wallet className={cn("size-6", stats.solde >= 0 ? "text-green-400" : "text-red-400")} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Solde estimé</p>
            <p className={cn(
              "text-2xl font-bold",
              stats.solde >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {stats.solde >= 0 ? "+" : ""}{stats.solde.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Pie Chart Section */}
        <div
          className={cn(
            "p-4 mb-6",
            "bg-card rounded-xl",
            "border border-border"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="size-5 text-accent-primary" />
            <h2 className="font-semibold">Répartition des dépenses</h2>
          </div>

          {/* Simple Pie Chart using CSS conic-gradient */}
          <div className="flex items-center gap-6">
            <div
              className="size-32 rounded-full flex-shrink-0"
              style={{
                background: generateConicGradient(stats.categoryStats),
              }}
            />
            <div className="flex-1 space-y-2">
              {stats.categoryStats.slice(0, 5).map(stat => (
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

        {/* Category Breakdown */}
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
            <div
              className={cn(
                "p-4",
                "bg-card rounded-xl",
                "border border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${CATEGORY_COLORS.revenu}20` }}
                >
                  <TrendingUp className="size-5" style={{ color: CATEGORY_COLORS.revenu }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{CATEGORY_LABELS.revenu}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.revenus.length} entrée{stats.revenus.length > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-lg font-semibold text-green-400">
                  +{stats.totalRevenus.toFixed(2)} €
                </p>
              </div>
            </div>
          )}
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
    const endAngle = currentAngle + (stat.percentage * 3.6); // 360 / 100 = 3.6
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
        <p className="text-lg font-semibold">
          {stat.total.toFixed(2)} €
        </p>
      </button>

      {/* Expanded content */}
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
