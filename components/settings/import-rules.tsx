"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RULE_ACTION_LABELS, type RuleLike } from "@/lib/bank-import";
import type { ImportRuleAction } from "@/db/schema";
import { cn } from "@/lib/utils";

const ACTIONS: ImportRuleAction[] = ["ignore", "watch", "variable"];
const ACTION_STYLES: Record<ImportRuleAction, string> = {
  ignore: "bg-bg-tertiary text-muted-foreground",
  watch: "bg-error/15 text-error",
  variable: "bg-info/15 text-info",
};

/** Gestion des règles d'import du relevé (libellé contient X → action) */
export const ImportRules = () => {
  const [rules, setRules] = useState<RuleLike[] | null>(null);
  const [pattern, setPattern] = useState("");
  const [label, setLabel] = useState("");
  const [action, setAction] = useState<ImportRuleAction>("ignore");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRules)
      .catch(() => setError("Règles indisponibles (base pas encore migrée ?)"));
  }, []);

  const add = async () => {
    if (pattern.trim().length < 2) return;
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: pattern.trim(), label: label.trim() || pattern.trim(), action }),
    });
    if (res.ok) {
      const rule = await res.json();
      setRules((list) => [...(list ?? []), rule]);
      setPattern("");
      setLabel("");
    }
  };

  const remove = async (id: number) => {
    setRules((list) => list?.filter((r) => r.id !== id) ?? null);
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
  };

  if (error) return <p className="text-sm text-muted-foreground">{error}</p>;
  if (!rules) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-4">
      {ACTIONS.map((a) => {
        const list = rules.filter((r) => r.action === a);
        if (list.length === 0) return null;
        return (
          <div key={a}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {RULE_ACTION_LABELS[a]}
            </p>
            <div className="flex flex-wrap gap-2">
              {list.map((r) => (
                <span
                  key={r.id}
                  className={cn("flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-sm", ACTION_STYLES[a])}
                  title={`Libellé contient « ${r.pattern} »`}
                >
                  {r.label}
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    aria-label={`Supprimer la règle ${r.label}`}
                    className="rounded-full p-0.5 opacity-60 hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-2 rounded-2xl bg-bg-tertiary/60 p-3">
        <p className="text-sm font-medium">Nouvelle règle</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Libellé contient…" value={pattern} onChange={(e) => setPattern(e.target.value)} />
          <Input placeholder="Nom affiché" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ImportRuleAction)}
            className="h-9 flex-1 rounded-md border border-input bg-bg-input px-3 text-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {RULE_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={pattern.trim().length < 2}
            className="flex items-center gap-1 rounded-md bg-accent-primary px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            <Plus className="size-4" /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};
