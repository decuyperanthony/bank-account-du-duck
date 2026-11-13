"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Landmark, Plus } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { EndingsTimeline, ProjectionChart } from "@/components/credits/credit-insights";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { CATEGORY_LABELS, type Category } from "@/lib/categories";
import {
  formatEuro,
  formatMonth,
  getInstallmentInfo,
  type InstallmentInfo,
  type InstallmentSource,
} from "@/lib/credits";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Credit = { p: InstallmentSource; info: InstallmentInfo };

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-border bg-card p-5">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

const CreditCard = ({ p, info }: Credit) => (
  <div className="rounded-2xl bg-bg-tertiary/60 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold">{p.title}</p>
        <p className="text-xs text-muted-foreground">
          {CATEGORY_LABELS[p.category as Category] ?? p.category} · le {p.day} du mois
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">{formatEuro(p.amount, 2)}</p>
        <p className="text-xs text-muted-foreground">/mois</p>
      </div>
    </div>

    <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
      <div
        className={cn("h-full rounded-full", info.isFinished ? "bg-success" : "bg-accent-primary")}
        style={{ width: `${info.progress}%` }}
      />
    </div>

    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Payé</p>
        <p className="font-medium tabular-nums">
          {info.paidCount}/{info.totalCount}
        </p>
      </div>
      <div className="text-center">
        <p className="text-muted-foreground">Restant dû</p>
        <p className="font-medium tabular-nums">{formatEuro(info.remainingAmount)}</p>
      </div>
      <div className="text-right">
        <p className="text-muted-foreground">Dernière éch.</p>
        <p className="font-medium capitalize">{formatMonth(info.lastMonth, true)}</p>
      </div>
    </div>
  </div>
);

export default function CreditsPage() {
  const [prelevements, setPrelevements] = useState<InstallmentSource[]>([]);
  const [loading, setLoading] = useState(true);
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

  const { active, finished, totalRemaining, totalMonthly } = useMemo(() => {
    const credits: Credit[] = prelevements
      .map((p) => ({ p, info: getInstallmentInfo(p) }))
      .filter((c): c is Credit => c.info !== null);
    const active = credits
      .filter((c) => !c.info.isFinished)
      .sort((a, b) => a.info.lastMonth - b.info.lastMonth);
    return {
      active,
      finished: credits.filter((c) => c.info.isFinished),
      totalRemaining: active.reduce((s, c) => s + c.info.remainingAmount, 0),
      totalMonthly: active.reduce((s, c) => s + c.p.amount, 0),
    };
  }, [prelevements]);

  if (loading) {
    return (
      <PageLayout activeTab="credits">
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="credits">
      <div className="mx-auto max-w-lg space-y-5 py-6">
        {/* Hero */}
        <div>
          <p className="text-sm text-muted-foreground">Crédits & échéanciers</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            {formatEuro(totalRemaining)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            restant dû · <span className="text-foreground">{formatEuro(totalMonthly, 2)}/mois</span> sur{" "}
            {active.length} crédit{active.length > 1 ? "s" : ""}
          </p>
        </div>

        <Section title="Projection des dépenses fixes" icon={<CalendarClock className="size-4" />}>
          <ProjectionChart prelevements={prelevements} />
        </Section>

        <Section title="Ce qui se libère" icon={<CheckCircle2 className="size-4" />}>
          <EndingsTimeline prelevements={prelevements} />
        </Section>

        <Section title="En cours" icon={<Landmark className="size-4" />}>
          {active.length === 0 ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Aucun crédit. Pour en ajouter un, crée un prélèvement et coche « Paiement étalé sur
                plusieurs mois ».
              </p>
              <Link
                href={ROUTES.HOME}
                className="inline-flex items-center gap-1.5 font-medium text-accent-primary"
              >
                <Plus className="size-4" /> Ajouter un prélèvement
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((c) => (
                <CreditCard key={c.p.id} {...c} />
              ))}
            </div>
          )}
        </Section>

        {finished.length > 0 && (
          <Section title="Terminés" icon={<CheckCircle2 className="size-4 text-success" />}>
            <p className="mb-3 text-xs text-muted-foreground">
              Ces prélèvements ont fini d&apos;être payés : tu peux les supprimer depuis l&apos;accueil.
            </p>
            <div className="space-y-3 opacity-70">
              {finished.map((c) => (
                <CreditCard key={c.p.id} {...c} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </PageLayout>
  );
}
