"use client";

import { Input } from "@/components/ui/input";
import {
  countInstallments,
  formatEuro,
  formatMonth,
  getInstallmentInfo,
  monthIndexOf,
  monthIndexToInput,
  parseMonthIndex,
  type InstallmentSource,
} from "@/lib/credits";

export type InstallmentFormValue = {
  /** "YYYY-MM" de la 1ʳᵉ échéance */
  startMonth: string;
  /** "YYYY-MM" de la dernière échéance */
  endMonth: string;
};

export const emptyInstallment = (): InstallmentFormValue => {
  const now = monthIndexOf(new Date());
  return { startMonth: monthIndexToInput(now), endMonth: "" };
};

/** Pré-remplit le formulaire depuis un prélèvement existant */
export const installmentFromPrelevement = (p: InstallmentSource): InstallmentFormValue => {
  const info = getInstallmentInfo(p);
  if (!info) return emptyInstallment();
  return {
    startMonth: monthIndexToInput(info.firstMonth),
    endMonth: monthIndexToInput(info.lastMonth),
  };
};

/** Convertit le formulaire en champs DB (endDate + totalAmount) */
export const installmentToPayload = (
  value: InstallmentFormValue,
  amount: number
): { endDate: string | null; totalAmount: number | null } => {
  const start = parseMonthIndex(value.startMonth);
  const end = parseMonthIndex(value.endMonth);
  if (end === null) return { endDate: null, totalAmount: null };
  const count = start !== null && start <= end ? countInstallments(start, end) : 1;
  // Le 15 du mois : aucun décalage de fuseau horaire ne peut changer le mois
  return {
    endDate: `${value.endMonth}-15`,
    totalAmount: Math.round(count * Math.abs(amount) * 100) / 100,
  };
};

const addMonths = (input: string, delta: number): string => {
  const idx = parseMonthIndex(input);
  return idx === null ? "" : monthIndexToInput(idx + delta);
};

type Props = {
  value: InstallmentFormValue;
  onChange: (value: InstallmentFormValue) => void;
  amount: string;
};

export const InstallmentFields = ({ value, onChange, amount }: Props) => {
  const start = parseMonthIndex(value.startMonth);
  const end = parseMonthIndex(value.endMonth);
  const count = start !== null && end !== null && start <= end ? countInstallments(start, end) : null;
  const monthly = Math.abs(Number.parseFloat(amount) || 0);
  const invalid = start !== null && end !== null && start > end;

  return (
    <div className="space-y-3 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">1ʳᵉ échéance</label>
          <Input
            type="month"
            value={value.startMonth}
            onChange={(e) => onChange({ ...value, startMonth: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dernière échéance</label>
          <Input
            type="month"
            value={value.endMonth}
            onChange={(e) => onChange({ ...value, endMonth: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">ou nombre d&apos;échéances</label>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Ex : 12"
          value={count ?? ""}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value);
            if (!value.startMonth || isNaN(n) || n < 1) return;
            onChange({ ...value, endMonth: addMonths(value.startMonth, n - 1) });
          }}
        />
      </div>

      <div className="rounded-xl bg-accent-muted px-3 py-2 text-xs">
        {invalid ? (
          <span className="text-error">La dernière échéance doit être après la première.</span>
        ) : count !== null && end !== null && start !== null ? (
          <span>
            <strong>{count} échéance{count > 1 ? "s" : ""}</strong> de {formatMonth(start)} à{" "}
            {formatMonth(end)}
            {monthly > 0 && <> · total {formatEuro(count * monthly)}</>}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Indique la 1ʳᵉ et la dernière échéance (ou le nombre d&apos;échéances).
          </span>
        )}
      </div>
    </div>
  );
};
