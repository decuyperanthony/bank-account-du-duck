/**
 * Calculs autour des prélèvements "à échéances" (crédits, impôts mensualisés,
 * paiements en plusieurs fois...).
 *
 * Modèle de données (inchangé en base) :
 * - `endDate`     : date de la DERNIÈRE échéance (seuls l'année et le mois comptent,
 *                   le jour réel est `day` du prélèvement)
 * - `totalAmount` : montant total du crédit = nb d'échéances × mensualité
 *
 * On en déduit le nombre d'échéances, donc le mois de la première échéance.
 * Une échéance est considérée payée si sa date est passée, ou si elle tombe ce
 * mois-ci et que le prélèvement est coché.
 */

export type InstallmentSource = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
  endDate?: string | Date | null;
  totalAmount?: number | null;
};

/** Mois absolu (année * 12 + mois 0-11), pratique pour les différences */
export type MonthIndex = number;

export const toMonthIndex = (year: number, month0: number): MonthIndex => year * 12 + month0;

export const monthIndexOf = (date: Date): MonthIndex =>
  toMonthIndex(date.getFullYear(), date.getMonth());

/** Lit "YYYY-MM..." sans passer par le fuseau horaire (évite les décalages d'un mois) */
export const parseMonthIndex = (value: string | Date | null | undefined): MonthIndex | null => {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : value;
  const match = /^(\d{4})-(\d{2})/.exec(str);
  if (!match) return null;
  return toMonthIndex(Number(match[1]), Number(match[2]) - 1);
};

/** "YYYY-MM" pour un <input type="month"> */
export const monthIndexToInput = (idx: MonthIndex): string => {
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
};

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const MONTH_SHORT_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

export const formatMonth = (idx: MonthIndex, short = false): string => {
  const date = new Date(Math.floor(idx / 12), idx % 12, 1);
  return (short ? MONTH_SHORT_FORMAT : MONTH_FORMAT).format(date);
};

export const formatEuro = (value: number, decimals = 0): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export type InstallmentInfo = {
  monthly: number;
  totalCount: number;
  paidCount: number;
  remainingCount: number;
  firstMonth: MonthIndex;
  lastMonth: MonthIndex;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progress: number;
  isFinished: boolean;
};

export const isInstallment = (p: InstallmentSource): boolean => parseMonthIndex(p.endDate) !== null;

/** Nombre d'échéances entre deux mois inclus */
export const countInstallments = (firstMonth: MonthIndex, lastMonth: MonthIndex): number =>
  Math.max(1, lastMonth - firstMonth + 1);

export const getInstallmentInfo = (
  p: InstallmentSource,
  now: Date = new Date()
): InstallmentInfo | null => {
  const lastMonth = parseMonthIndex(p.endDate);
  if (lastMonth === null) return null;

  const monthly = Math.abs(p.amount);
  const totalCount =
    p.totalAmount && monthly > 0 ? Math.max(1, Math.round(Math.abs(p.totalAmount) / monthly)) : 1;
  const firstMonth = lastMonth - totalCount + 1;

  const currentMonth = monthIndexOf(now);
  // Échéances des mois strictement passés
  let paidCount = Math.min(totalCount, Math.max(0, currentMonth - firstMonth));
  // Échéance du mois en cours : payée si cochée ou si la date est passée
  if (currentMonth >= firstMonth && currentMonth <= lastMonth) {
    if (p.completed || now.getDate() > p.day) paidCount += 1;
  }
  paidCount = Math.min(totalCount, paidCount);

  const remainingCount = totalCount - paidCount;
  return {
    monthly,
    totalCount,
    paidCount,
    remainingCount,
    firstMonth,
    lastMonth,
    totalAmount: totalCount * monthly,
    paidAmount: paidCount * monthly,
    remainingAmount: remainingCount * monthly,
    progress: Math.round((paidCount / totalCount) * 100),
    isFinished: remainingCount === 0,
  };
};

/** Un prélèvement est-il actif (prélevé) sur un mois donné ? */
export const isActiveInMonth = (p: InstallmentSource, month: MonthIndex): boolean => {
  const info = getInstallmentInfo(p);
  if (!info) return true;
  return month >= info.firstMonth && month <= info.lastMonth;
};

export type EndingGroup = {
  /** Premier mois SANS le prélèvement */
  freedMonth: MonthIndex;
  items: { p: InstallmentSource; info: InstallmentInfo }[];
  /** Montant mensuel libéré (positif = dépense en moins) */
  freedAmount: number;
};

/** Prélèvements qui vont s'arrêter, groupés par mois de libération */
export const getUpcomingEndings = (list: InstallmentSource[], now: Date = new Date()): EndingGroup[] => {
  const groups = new Map<MonthIndex, EndingGroup>();
  for (const p of list) {
    const info = getInstallmentInfo(p, now);
    if (!info || info.isFinished) continue;
    const freedMonth = info.lastMonth + 1;
    const group = groups.get(freedMonth) ?? { freedMonth, items: [], freedAmount: 0 };
    group.items.push({ p, info });
    group.freedAmount += p.amount;
    groups.set(freedMonth, group);
  }
  return [...groups.values()].sort((a, b) => a.freedMonth - b.freedMonth);
};

export type ProjectionPoint = { month: MonthIndex; expenses: number; installments: number };

/** Total des dépenses fixes (hors revenus) prévues pour les N prochains mois */
export const getProjection = (
  list: InstallmentSource[],
  months = 24,
  now: Date = new Date()
): ProjectionPoint[] => {
  const start = monthIndexOf(now);
  const infos = list.map((p) => ({ p, info: getInstallmentInfo(p, now) }));
  return Array.from({ length: months }, (_, i) => {
    const month = start + i;
    let expenses = 0;
    let installments = 0;
    for (const { p, info } of infos) {
      if (p.amount <= 0) continue;
      if (info && (month < info.firstMonth || month > info.lastMonth)) continue;
      expenses += p.amount;
      if (info) installments += p.amount;
    }
    return { month, expenses, installments };
  });
};
