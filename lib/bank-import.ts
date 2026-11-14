/**
 * Import d'un relevé bancaire (LCL ou autre) : parsing CSV / OFX + classification.
 * Tout tourne côté client : le fichier n'est jamais envoyé tel quel au serveur,
 * seules les opérations classées le sont.
 *
 * Le parsing CSV est volontairement tolérant (séparateur, encodage, colonnes
 * détectés automatiquement) en attendant de le caler sur un vrai export LCL.
 */

import type { ImportRuleAction, TransactionKind } from "@/db/schema";

export type RawTransaction = {
  date: string; // YYYY-MM-DD
  label: string;
  /** Convention de l'app : positif = dépense, négatif = rentrée */
  amount: number;
  hash: string;
};

export type ParseResult = {
  format: "csv" | "ofx" | "pdf";
  transactions: RawTransaction[];
  skippedLines: number;
  /** Titulaire du compte lu sur le relevé (ex : "ANTHONY DE CUYPER"), pour repérer les virements internes */
  holderName?: string;
};

export type RuleLike = { id: number; pattern: string; action: ImportRuleAction; label: string };

export type PrelevementLike = {
  id: number;
  title: string;
  day: number;
  amount: number;
  completed: boolean;
};

export type ClassifiedTransaction = RawTransaction & {
  kind: TransactionKind;
  tag: string | null;
  prelevementId: number | null;
  /** Montant relevé − montant prévu (pour les rapprochements) */
  amountDiff: number | null;
};

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Majuscules, sans accents, que des lettres / chiffres séparés par un espace */
export const normalizeLabel = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

/** Décode un fichier en UTF-8, ou en Windows-1252 (fréquent pour les exports bancaires) */
export const decodeFile = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
};

const parseAmount = (value: string): number | null => {
  const cleaned = value.replace(/[\s €]/g, "").replace(/^\+/, "");
  if (!/^-?\d+([.,]\d{1,2})?$/.test(cleaned)) return null;
  return Number.parseFloat(cleaned.replace(",", "."));
};

const parseDate = (value: string): string | null => {
  const v = value.trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(v);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2]}-${m[1]}`;
  }
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
};

/** Découpe une ligne CSV en gérant les guillemets */
const splitCsvLine = (line: string, sep: string): string[] => {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === sep && !quoted) {
      cells.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  cells.push(cur.trim());
  return cells;
};

const detectSeparator = (lines: string[]): string => {
  const sample = lines.slice(0, 20).join("\n");
  const counts = [";", "\t", ","].map((s) => ({ s, n: sample.split(s).length }));
  return counts.sort((a, b) => b.n - a.n)[0].s;
};

/** Ajoute une empreinte stable (les doublons exacts d'un même fichier sont numérotés) */
export const withHashes = (list: Omit<RawTransaction, "hash">[]): RawTransaction[] => {
  const seen = new Map<string, number>();
  return list.map((t) => {
    const base = `${t.date}|${normalizeLabel(t.label)}|${t.amount.toFixed(2)}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...t, hash: `${base}|${n}` };
  });
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const parseOfx = (text: string): ParseResult => {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tag = (block: string, name: string) =>
    new RegExp(`<${name}>([^<\\r\\n]*)`, "i").exec(block)?.[1]?.trim() ?? "";
  const list: Omit<RawTransaction, "hash">[] = [];
  let skipped = 0;
  for (const b of blocks) {
    const d = tag(b, "DTPOSTED");
    const amount = parseAmount(tag(b, "TRNAMT"));
    const label = [tag(b, "NAME"), tag(b, "MEMO")].filter(Boolean).join(" ");
    if (d.length < 8 || amount === null || !label) {
      skipped++;
      continue;
    }
    list.push({ date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, label, amount: -amount });
  }
  return { format: "ofx", transactions: withHashes(list), skippedLines: skipped };
};

const HEADER_HINTS = {
  date: /^date( (operation|op))?$/,
  amount: /^(montant|amount)/,
  debit: /^debit/,
  credit: /^credit/,
  label: /^(libelle|label|description|intitule)/,
};

const parseCsv = (text: string): ParseResult => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const sep = detectSeparator(lines);
  const rows = lines.map((l) => splitCsvLine(l, sep));

  // En-tête éventuel : repère les colonnes par leur nom
  const headerIdx = rows.findIndex((r) => r.some((c) => HEADER_HINTS.date.test(normalizeLabel(c).toLowerCase())));
  const header = headerIdx >= 0 ? rows[headerIdx].map((c) => normalizeLabel(c).toLowerCase()) : null;
  const col = (re: RegExp) => (header ? header.findIndex((h) => re.test(h)) : -1);
  const cols = {
    date: col(HEADER_HINTS.date),
    amount: col(HEADER_HINTS.amount),
    debit: col(HEADER_HINTS.debit),
    credit: col(HEADER_HINTS.credit),
    label: col(HEADER_HINTS.label),
  };

  const list: Omit<RawTransaction, "hash">[] = [];
  let skipped = 0;

  rows.forEach((cells, i) => {
    if (i <= headerIdx) return;

    // Date : colonne connue, sinon 1ʳᵉ cellule qui ressemble à une date
    const dateCell = cols.date >= 0 ? cols.date : cells.findIndex((c) => parseDate(c) !== null);
    const date = dateCell >= 0 ? parseDate(cells[dateCell] ?? "") : null;

    // Montant : colonne montant, ou crédit − débit, sinon 1ʳᵉ cellule numérique
    let bankAmount: number | null = null;
    let amountCells: number[] = [];
    if (cols.amount >= 0) {
      bankAmount = parseAmount(cells[cols.amount] ?? "");
      amountCells = [cols.amount];
    } else if (cols.debit >= 0 || cols.credit >= 0) {
      const debit = Math.abs(parseAmount(cells[cols.debit] ?? "") ?? 0);
      const credit = Math.abs(parseAmount(cells[cols.credit] ?? "") ?? 0);
      bankAmount = debit || credit ? credit - debit : null;
      amountCells = [cols.debit, cols.credit];
    } else {
      const idx = cells.findIndex((c, j) => j !== dateCell && parseAmount(c) !== null);
      if (idx >= 0) {
        bankAmount = parseAmount(cells[idx]);
        amountCells = [idx];
      }
    }

    // Libellé : colonne connue, sinon toutes les cellules texte restantes
    const label =
      cols.label >= 0
        ? cells[cols.label]
        : cells
            .filter((c, j) => j !== dateCell && !amountCells.includes(j) && c && parseDate(c) === null && parseAmount(c) === null)
            .join(" ");

    if (!date || bankAmount === null || !label?.trim()) {
      skipped++;
      return;
    }
    list.push({ date, label: label.replace(/\s+/g, " ").trim(), amount: -bankAmount });
  });

  return { format: "csv", transactions: withHashes(list), skippedLines: skipped };
};

export const parseStatement = (text: string): ParseResult =>
  /<STMTTRN>/i.test(text) ? parseOfx(text) : parseCsv(text);

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set(["PRLV", "SEPA", "CB", "VIR", "CARTE", "DE", "DU", "LA", "LE", "LES", "ET"]);

/** Mots significatifs d'un titre de prélèvement ("Crédit Dyson" → ["CREDIT", "DYSON"]) */
const titleTokens = (title: string) =>
  normalizeLabel(title)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

const matchPrelevement = (tx: RawTransaction, list: PrelevementLike[]): PrelevementLike | null => {
  const words = new Set(normalizeLabel(tx.label).split(" "));
  const norm = ` ${normalizeLabel(tx.label)} `;
  const candidates = list.filter((p) => {
    if (Math.sign(p.amount) !== Math.sign(tx.amount)) return false;
    const full = normalizeLabel(p.title);
    if (full && norm.includes(` ${full} `)) return true;
    return titleTokens(p.title).some((t) => words.has(t));
  });
  if (candidates.length === 0) return null;
  // Le plus proche en montant, puis en jour du mois
  const txDay = Number(tx.date.slice(8, 10));
  return candidates.sort(
    (a, b) =>
      Math.abs(a.amount - tx.amount) - Math.abs(b.amount - tx.amount) ||
      Math.abs(a.day - txDay) - Math.abs(b.day - txDay)
  )[0];
};

const NAME_PARTICLES = new Set(["DE", "DU", "DES", "LA", "LE", "VAN", "VON", "DI"]);

/**
 * Virement entre ses propres comptes : libellé de virement qui contient le prénom
 * ET le nom du titulaire ("VIR INST Anthony de Cuyper"). Un virement au seul nom
 * de famille (ex : argent de poche des enfants) n'est pas concerné.
 */
export const isInternalTransfer = (label: string, holderName?: string): boolean => {
  if (!holderName) return false;
  const norm = normalizeLabel(label);
  if (!/^VIR/.test(norm)) return false;
  const words = new Set(norm.split(" "));
  const tokens = normalizeLabel(holderName)
    .split(" ")
    .filter((t) => t.length >= 2 && !NAME_PARTICLES.has(t));
  return tokens.length >= 2 && tokens.every((t) => words.has(t));
};

export const classifyTransactions = (
  transactions: RawTransaction[],
  rules: RuleLike[],
  prelevements: PrelevementLike[],
  options: { holderName?: string } = {}
): ClassifiedTransaction[] =>
  transactions.map((tx) => {
    const norm = normalizeLabel(tx.label);
    const rule = rules.find((r) => {
      const pattern = normalizeLabel(r.pattern);
      return pattern && norm.includes(pattern);
    });
    if (rule) {
      return { ...tx, kind: rule.action, tag: rule.label, prelevementId: null, amountDiff: null };
    }
    if (isInternalTransfer(tx.label, options.holderName)) {
      return { ...tx, kind: "ignore", tag: "Virement interne", prelevementId: null, amountDiff: null };
    }
    const match = matchPrelevement(tx, prelevements);
    if (match) {
      const diff = Math.round((tx.amount - match.amount) * 100) / 100;
      return { ...tx, kind: "matched", tag: match.title, prelevementId: match.id, amountDiff: diff };
    }
    return {
      ...tx,
      kind: tx.amount < 0 ? "income" : "unknown",
      tag: null,
      prelevementId: null,
      amountDiff: null,
    };
  });

/** Règles créées au premier lancement (modifiables dans Réglages) */
export const DEFAULT_RULES: Omit<RuleLike, "id">[] = [
  { pattern: "REVOLUT", action: "ignore", label: "Virement Revolut" },
  { pattern: "RETRAIT", action: "ignore", label: "Retrait espèces" },
  { pattern: "BOLT", action: "ignore", label: "Bolt" },
  { pattern: "PLAYSTATION", action: "ignore", label: "PlayStation" },
  { pattern: "MMBILL", action: "watch", label: "Écarts 🙈" },
  { pattern: "MARCADIS", action: "variable", label: "Courses Carrefour" },
];

export const RULE_ACTION_LABELS: Record<ImportRuleAction, string> = {
  ignore: "Ignorer",
  watch: "À surveiller",
  variable: "Dépense variable",
};
