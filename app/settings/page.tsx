"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronRight,
  Database,
  Download,
  FileUp,
  ListFilter,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { ImportRules } from "@/components/settings/import-rules";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type DbStatus = "checking" | "connected" | "disconnected";

const THEMES = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
    <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">{children}</div>
  </section>
);

const Row = ({
  icon,
  iconClass,
  title,
  subtitle,
  right,
  onClick,
  href,
  danger,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) => {
  const content = (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className={cn("block font-medium", danger && "text-error")}>{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      {right ?? ((href || onClick) && <ChevronRight className="size-4 text-muted-foreground" />)}
    </>
  );
  const className = "flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-tertiary/50";
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus>("checking");
  const [isExporting, setIsExporting] = useState(false);

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
    setMounted(true);
  }, [checkDbStatus]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `duck-bank-export-${new Date().toISOString().split("T")[0]}.json`;
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  const dbBadge = {
    checking: { text: "Vérification…", dot: "bg-warning animate-pulse" },
    connected: { text: "Connectée", dot: "bg-success" },
    disconnected: { text: "Hors ligne", dot: "bg-error" },
  }[dbStatus];

  return (
    <PageLayout activeTab="settings">
      <div className="mx-auto max-w-lg space-y-6 py-6">
        <h1 className="text-2xl font-bold">Réglages</h1>

        <Section title="Apparence">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-bg-tertiary p-1">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={mounted && theme === value}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors",
                    mounted && theme === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Relevé bancaire">
          <Row
            href={ROUTES.IMPORT}
            icon={<FileUp className="size-5" />}
            iconClass="bg-accent-muted text-accent-primary"
            title="Importer un relevé LCL"
            subtitle="Vérifier les montants, suivre les écarts"
          />
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                <ListFilter className="size-5" />
              </span>
              <span>
                <span className="block font-medium">Règles d&apos;import</span>
                <span className="block text-xs text-muted-foreground">
                  Si le libellé contient… → ignorer, surveiller ou dépense variable
                </span>
              </span>
            </div>
            <ImportRules />
          </div>
        </Section>

        <Section title="Données">
          <Row
            onClick={handleExport}
            icon={<Download className="size-5" />}
            iconClass="bg-info/15 text-info"
            title={isExporting ? "Export en cours…" : "Exporter mes données"}
            subtitle="Prélèvements, historique, règles et relevés (JSON)"
          />
          <Row
            onClick={checkDbStatus}
            icon={<Database className="size-5" />}
            iconClass="bg-teal-500/15 text-teal-400"
            title="Base de données"
            subtitle="Neon PostgreSQL"
            right={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", dbBadge.dot)} />
                {dbBadge.text}
              </span>
            }
          />
        </Section>

        <Section title="Compte">
          <Row
            onClick={handleLogout}
            icon={<LogOut className="size-5" />}
            iconClass="bg-error/15 text-error"
            title="Se déconnecter"
            danger
            right={<span />}
          />
        </Section>

        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png?v=2" alt="" width={56} height={56} className="size-14 rounded-2xl" />
          <p className="text-sm font-semibold">Duck Bank V2</p>
          <p className="text-xs text-muted-foreground">Version 2.0.0 · Made with 🦆</p>
        </div>
      </div>
    </PageLayout>
  );
}
