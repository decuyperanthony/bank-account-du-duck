"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, EyeOff, FileUp, HelpCircle, Plus, ShoppingCart, Upload } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import {
  classifyTransactions,
  decodeFile,
  parseStatement,
  type ClassifiedTransaction,
  type PrelevementLike,
  type RuleLike,
} from "@/lib/bank-import";
import { formatEuro } from "@/lib/credits";
import { cn } from "@/lib/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const fmtDate = (iso: string) => DATE_FORMAT.format(new Date(`${iso}T12:00:00`));

const TxRow = ({ tx, children }: { tx: ClassifiedTransaction; children?: React.ReactNode }) => (
  <div className="py-2.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{tx.tag ?? tx.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {fmtDate(tx.date)} · {tx.label}
        </p>
      </div>
      <p className={cn("shrink-0 text-sm font-semibold tabular-nums", tx.amount < 0 && "text-success")}>
        {tx.amount < 0 ? "+" : "−"}
        {formatEuro(Math.abs(tx.amount), 2)}
      </p>
    </div>
    {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
  </div>
);

const Group = ({
  title,
  icon,
  items,
  open = false,
  hint,
  render,
}: {
  title: string;
  icon: React.ReactNode;
  items: ClassifiedTransaction[];
  open?: boolean;
  hint?: string;
  render?: (tx: ClassifiedTransaction) => React.ReactNode;
}) => {
  if (items.length === 0) return null;
  const total = items.reduce((s, t) => s + t.amount, 0);
  return (
    <details open={open} className="group rounded-3xl border border-border bg-card px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
          <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">{formatEuro(Math.abs(total))}</span>
      </summary>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 divide-y divide-border">
        {items.map((tx) => (
          <TxRow key={tx.hash} tx={tx}>
            {render?.(tx)}
          </TxRow>
        ))}
      </div>
    </details>
  );
};

const SmallButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    {...props}
    className={cn(
      "rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium transition-colors hover:bg-border disabled:opacity-50",
      props.className
    )}
  />
);

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [txs, setTxs] = useState<ClassifiedTransaction[]>([]);
  const [prelevements, setPrelevements] = useState<PrelevementLike[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<{ inserted: number; duplicates: number } | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSaved(null);
    setDone(new Set());
    setBusy(true);
    try {
      const text = await decodeFile(file);
      const parsed = parseStatement(text);
      if (parsed.transactions.length === 0) {
        setError("Aucune opération reconnue dans ce fichier. Envoie-le à Claude pour adapter l'import 🙂");
        setTxs([]);
        return;
      }
      const [rulesRes, prlRes] = await Promise.all([fetch("/api/rules"), fetch("/api/prelevements")]);
      const rules: RuleLike[] = rulesRes.ok ? await rulesRes.json() : [];
      const prl: PrelevementLike[] = prlRes.ok ? await prlRes.json() : [];
      setPrelevements(prl);
      setTxs(classifyTransactions(parsed.transactions, rules, prl));
      setSkipped(parsed.skippedLines);
      setFileName(file.name);
    } catch (e) {
      console.error(e);
      setError("Impossible de lire ce fichier.");
    } finally {
      setBusy(false);
    }
  };

  const update = (hash: string, patch: Partial<ClassifiedTransaction>) =>
    setTxs((list) => list.map((t) => (t.hash === hash ? { ...t, ...patch } : t)));
  const markDone = (key: string) => setDone((s) => new Set(s).add(key));

  const updateAmount = async (tx: ClassifiedTransaction) => {
    if (!tx.prelevementId) return;
    const res = await fetch(`/api/prelevements/${tx.prelevementId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: tx.amount }),
    });
    if (res.ok) {
      update(tx.hash, { amountDiff: 0 });
      markDone(`amount-${tx.hash}`);
    }
  };

  const addAsPrelevement = async (tx: ClassifiedTransaction) => {
    // "Prélèvement PRLV SEPA FREE MOBILE 12/11" → "FREE MOBILE"
    const title =
      tx.label
        .replace(/^(pr[ée]l[èe]vement|carte|virement|vir|prlv|sepa|cb)\s+/gi, "")
        .replace(/^(pr[ée]l[èe]vement|carte|virement|vir|prlv|sepa|cb)\s+/gi, "")
        .replace(/^(pr[ée]l[èe]vement|carte|virement|vir|prlv|sepa|cb)\s+/gi, "")
        .replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?$/, "")
        .trim()
        .slice(0, 40) || tx.label.slice(0, 40);
    const res = await fetch("/api/prelevements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, day: Number(tx.date.slice(8, 10)), amount: tx.amount, category: "autre" }),
    });
    if (res.ok) {
      const created = await res.json();
      update(tx.hash, { kind: "matched", tag: created.title, prelevementId: created.id, amountDiff: 0 });
    }
  };

  // Rapprochés du mois en cours pas encore cochés
  const currentMonth = new Date().toISOString().slice(0, 7);
  const toCheck = txs.filter((t) => {
    if (t.kind !== "matched" || !t.prelevementId || !t.date.startsWith(currentMonth)) return false;
    return !prelevements.find((p) => p.id === t.prelevementId)?.completed;
  });

  const checkAllPaid = async () => {
    setBusy(true);
    const ids = [...new Set(toCheck.map((t) => t.prelevementId!))];
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/prelevements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        })
      )
    );
    setPrelevements((list) => list.map((p) => (ids.includes(p.id) ? { ...p, completed: true } : p)));
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: txs.map(({ hash, date, label, amount, kind, tag, prelevementId }) => ({
            hash,
            date,
            label,
            amount,
            kind,
            tag,
            prelevementId,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(await res.json());
    } catch (e) {
      console.error(e);
      setError("L'enregistrement a échoué. Réessaie plus tard.");
    } finally {
      setBusy(false);
    }
  };

  const by = (kind: ClassifiedTransaction["kind"]) => txs.filter((t) => t.kind === kind);
  const mismatches = txs.filter((t) => t.kind === "matched" && t.amountDiff && Math.abs(t.amountDiff) >= 0.01);
  const matched = by("matched").filter((t) => !mismatches.includes(t));

  return (
    <PageLayout activeTab="settings">
      <div className="mx-auto max-w-lg space-y-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Importer un relevé</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Export CSV ou OFX de ton espace LCL. Le fichier est lu sur ton téléphone : seules les
            opérations classées sont enregistrées.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.ofx,.txt,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card px-5 py-8 text-center transition-colors hover:border-accent-primary"
        >
          <FileUp className="size-8 text-accent-primary" />
          <span className="font-semibold">{fileName ?? "Choisir un fichier"}</span>
          <span className="text-xs text-muted-foreground">
            {fileName ? `${txs.length} opérations${skipped ? ` · ${skipped} lignes ignorées` : ""} · changer` : ".csv ou .ofx"}
          </span>
        </button>

        {error && (
          <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p>
        )}

        {txs.length > 0 && (
          <>
            <Group
              title="Montants différents"
              icon={<AlertTriangle className="size-4 text-warning" />}
              items={mismatches}
              open
              hint="Le montant prélevé ne correspond pas à celui enregistré dans l'app."
              render={(tx) => {
                const p = prelevements.find((x) => x.id === tx.prelevementId);
                return done.has(`amount-${tx.hash}`) ? (
                  <span className="text-xs text-success">✓ Mis à jour</span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Prévu {formatEuro(p?.amount ?? 0, 2)} ({tx.amountDiff! > 0 ? "+" : ""}
                      {formatEuro(tx.amountDiff!, 2)})
                    </span>
                    <SmallButton onClick={() => updateAmount(tx)} className="text-accent-primary">
                      Passer à {formatEuro(tx.amount, 2)}
                    </SmallButton>
                  </>
                );
              }}
            />

            <Group
              title="Non reconnus"
              icon={<HelpCircle className="size-4 text-info" />}
              items={by("unknown")}
              open
              hint="Dépenses qui ne correspondent à aucun prélèvement ni à aucune règle."
              render={(tx) => (
                <>
                  <SmallButton onClick={() => addAsPrelevement(tx)}>
                    <Plus className="mr-1 inline size-3" />
                    Prélèvement
                  </SmallButton>
                  <SmallButton onClick={() => update(tx.hash, { kind: "watch", tag: "Écarts 🙈" })}>🙈 Écart</SmallButton>
                  <SmallButton onClick={() => update(tx.hash, { kind: "variable", tag: "Dépense variable" })}>
                    Variable
                  </SmallButton>
                  <SmallButton onClick={() => update(tx.hash, { kind: "ignore", tag: "Ignoré" })}>Ignorer</SmallButton>
                </>
              )}
            />

            <Group
              title="Rapprochés"
              icon={<CheckCircle2 className="size-4 text-success" />}
              items={matched}
              hint={
                toCheck.length > 0
                  ? `${toCheck.length} prélèvement(s) de ce mois pas encore cochés dans l'app.`
                  : undefined
              }
            />
            {toCheck.length > 0 && (
              <Button onClick={checkAllPaid} disabled={busy} variant="outline" className="w-full">
                <CheckCircle2 className="mr-2 size-4" />
                Cocher les {toCheck.length} prélèvements payés
              </Button>
            )}

            <Group title="Écarts à surveiller 🙈" icon={<span>👀</span>} items={by("watch")} />
            <Group title="Dépenses variables" icon={<ShoppingCart className="size-4" />} items={by("variable")} />
            <Group title="Rentrées" icon={<span className="text-success">＋</span>} items={by("income")} />
            <Group title="Ignorés" icon={<EyeOff className="size-4 text-muted-foreground" />} items={by("ignore")} />

            {saved ? (
              <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
                ✓ {saved.inserted} opérations enregistrées
                {saved.duplicates > 0 && ` (${saved.duplicates} déjà importées)`}
              </p>
            ) : (
              <Button onClick={save} disabled={busy} className="w-full">
                <Upload className="mr-2 size-4" />
                Enregistrer l&apos;import ({txs.length} opérations)
              </Button>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
