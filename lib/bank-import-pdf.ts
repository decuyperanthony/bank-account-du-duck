/**
 * Lecture des relevés de compte LCL au format PDF.
 *
 * Le PDF est lu dans le navigateur avec pdf.js : on récupère chaque morceau de
 * texte avec sa position, puis on reconstruit les lignes du tableau
 * DATE | LIBELLE | VALEUR | DEBIT | CREDIT. Débit ou crédit se déduit de la
 * position horizontale du montant (les montants sont alignés à droite).
 */

import { withHashes, type ParseResult, type RawTransaction } from "@/lib/bank-import";

export type PdfItem = { x: number; y: number; w: number; str: string };

const AMOUNT_RE = /^\d{1,3}(?:[  ]\d{3})*,\d{2}$/;
const DATE_RE = /^(\d{2})\.(\d{2})$/;
const PERIOD_RE = /du (\d{2})\.(\d{2})\.(\d{4}) au (\d{2})\.(\d{2})\.(\d{4})/;
const SKIP_LABEL_RE = /SOLDE|TOTAUX/i;
const HOLDER_RE = /^(?:MONSIEUR|MADAME|MADEMOISELLE)\s+(.+)$/i;

type Header = { valeurRight: number; creditLeft: number; labelLeft: number };

/** Regroupe les morceaux de texte par ligne (même ordonnée, à 2 pt près), triés de gauche à droite */
const toLines = (items: PdfItem[]): PdfItem[][] => {
  const sorted = [...items].filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfItem[][] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].y - item.y) <= 2) last.push(item);
    else lines.push([item]);
  }
  return lines.map((l) => l.sort((a, b) => a.x - b.x));
};

const findHeader = (line: PdfItem[]): Header | null => {
  const get = (name: string) => line.find((i) => i.str.trim().toUpperCase() === name);
  const valeur = get("VALEUR");
  const credit = get("CREDIT");
  const label = get("LIBELLE");
  if (!valeur || !credit || !get("DEBIT") || !get("DATE")) return null;
  return {
    valeurRight: valeur.x + valeur.w,
    creditLeft: credit.x,
    labelLeft: label ? Math.min(label.x, 80) : 70,
  };
};

/** Année d'une date "JJ.MM" d'après la période du relevé (gère le passage décembre → janvier) */
const yearFor = (month: number, period: { startMonth: number; startYear: number; endYear: number } | null) => {
  if (!period) return new Date().getFullYear();
  return month >= period.startMonth ? period.startYear : period.endYear;
};

export const isLclStatement = (pages: PdfItem[][]): boolean =>
  pages.some((p) => toLines(p).some((l) => findHeader(l) !== null));

export const parseLclPdf = (pages: PdfItem[][]): ParseResult => {
  const allText = pages.flat().map((i) => i.str).join(" ");
  const m = PERIOD_RE.exec(allText);
  const period = m ? { startMonth: Number(m[2]), startYear: Number(m[3]), endYear: Number(m[6]) } : null;

  const list: Omit<RawTransaction, "hash">[] = [];
  let skipped = 0;

  for (const page of pages) {
    let header: Header | null = null;
    for (const line of toLines(page)) {
      header = findHeader(line) ?? header;
      if (!header) continue;

      const dateMatch = DATE_RE.exec(line[0]?.str.trim() ?? "");
      if (!dateMatch || line[0].x > header.labelLeft) continue;

      // Montant : à droite de la colonne VALEUR
      const amountItem = [...line].reverse().find((i) => i.x >= header!.valeurRight - 2 && AMOUNT_RE.test(i.str.trim()));
      const label = line
        .filter((i) => i !== line[0] && i.x < header!.valeurRight - 40)
        .map((i) => i.str.trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (SKIP_LABEL_RE.test(label)) continue;
      if (!amountItem || !label) {
        skipped++;
        continue;
      }

      const value = Number.parseFloat(amountItem.str.replace(/[  ]/g, "").replace(",", "."));
      const isCredit = amountItem.x + amountItem.w > header.creditLeft;
      const day = dateMatch[1];
      const month = Number(dateMatch[2]);
      list.push({
        date: `${yearFor(month, period)}-${dateMatch[2]}-${day}`,
        label,
        // Convention de l'app : positif = dépense
        amount: isCredit ? -value : value,
      });
    }
  }

  // Titulaire : bloc d'adresse en tête de relevé ("MONSIEUR PRENOM NOM")
  const holderName = pages
    .flat()
    .map((i) => HOLDER_RE.exec(i.str.trim())?.[1])
    .find((name) => name && name.split(/\s+/).length >= 2);

  return { format: "pdf", transactions: withHashes(list), skippedLines: skipped, holderName };
};

/** Extrait le texte positionné de chaque page (pdf.js chargé à la demande) */
export const extractPdfItems = async (file: File): Promise<PdfItem[][]> => {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: PdfItem[][] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(
      content.items.flatMap((it) =>
        "str" in it ? [{ x: it.transform[4], y: it.transform[5], w: it.width, str: it.str }] : []
      )
    );
  }
  return pages;
};
