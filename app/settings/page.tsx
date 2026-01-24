"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Database, Palette, Download, Info, Sun, Moon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DbStatus = "checking" | "connected" | "disconnected";
type Theme = "light" | "dark";

export default function SettingsPage() {
  const [dbStatus, setDbStatus] = useState<DbStatus>("checking");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isExporting, setIsExporting] = useState(false);

  // Check database status
  const checkDbStatus = useCallback(async () => {
    setDbStatus("checking");
    try {
      const response = await fetch("/api/db-status");
      const data = await response.json();
      setDbStatus(data.connected ? "connected" : "disconnected");
    } catch {
      setDbStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkDbStatus();
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [checkDbStatus]);

  // Toggle theme (UI only - actual implementation pending)
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Export data
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export");
      const data = await response.json();

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bank-account-du-duck-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageLayout activeTab="settings">
      <div className="max-w-lg mx-auto py-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold mb-6">Réglages</h1>

        {/* Settings List */}
        <div className="flex flex-col gap-4">
          {/* Database Status */}
          <SettingsCard
            icon={<Database className="size-5" />}
            iconBg="bg-teal-500/20"
            iconColor="text-teal-400"
            title="Base de données"
            subtitle="Neon PostgreSQL"
            action={
              <StatusBadge
                status={dbStatus}
                onClick={checkDbStatus}
              />
            }
          />

          {/* Theme Toggle */}
          <SettingsCard
            icon={<Palette className="size-5" />}
            iconBg="bg-violet-500/20"
            iconColor="text-violet-400"
            title="Thème"
            subtitle="Apparence de l'app"
            action={
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "flex items-center justify-center",
                  "size-10 rounded-full",
                  "bg-bg-tertiary hover:bg-border-default",
                  "transition-colors"
                )}
              >
                {theme === "dark" ? (
                  <Moon className="size-5 text-violet-400" />
                ) : (
                  <Sun className="size-5 text-yellow-400" />
                )}
              </button>
            }
          />

          {/* Export Data */}
          <SettingsCard
            icon={<Download className="size-5" />}
            iconBg="bg-accent-muted"
            iconColor="text-accent-primary"
            title="Exporter les données"
            subtitle="Télécharger tes abonnements"
            action={
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-center",
                  "size-10 rounded-full",
                  "bg-bg-tertiary hover:bg-border-default",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isExporting ? (
                  <div className="size-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground" />
                )}
              </button>
            }
          />

          {/* About */}
          <SettingsCard
            icon={<Info className="size-5" />}
            iconBg="bg-gray-500/20"
            iconColor="text-gray-400"
            title="À propos"
            subtitle="Bank Account du Duck v0.1.0"
            action={
              <span className="text-xs text-muted-foreground">
                Made with 🦆
              </span>
            }
          />
        </div>
      </div>
    </PageLayout>
  );
}

// Settings Card Component
type SettingsCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
};

function SettingsCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  action,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4",
        "bg-card rounded-xl",
        "border border-border"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center",
          "size-12 rounded-full",
          iconBg,
          iconColor
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>

      {/* Action */}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Status Badge Component
type StatusBadgeProps = {
  status: DbStatus;
  onClick?: () => void;
};

function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "checking":
        return {
          text: "Vérification...",
          dotColor: "bg-yellow-400",
          animate: true,
        };
      case "connected":
        return {
          text: "Connecté",
          dotColor: "bg-success",
          animate: false,
        };
      case "disconnected":
        return {
          text: "Déconnecté",
          dotColor: "bg-error",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5",
        "bg-bg-tertiary rounded-full",
        "text-xs font-medium",
        "hover:bg-border-default transition-colors"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          config.dotColor,
          config.animate && "animate-pulse"
        )}
      />
      <span className="text-muted-foreground">{config.text}</span>
    </button>
  );
}
