"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit2, Check, X, Plus, AlertTriangle, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageLayout } from "@/components/layout/page-layout";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/lib/categories";

type PrelevementType = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
  endDate?: string | null;
  totalAmount?: number | null;
};

const calculateInstallmentProgress = (
  endDate: string | null | undefined,
  totalAmount: number | null | undefined,
  monthlyAmount: number
): { progress: number; remainingMonths: number; paidAmount: number } | null => {
  if (!endDate || !totalAmount || monthlyAmount === 0) return null;

  const absMonthly = Math.abs(monthlyAmount);
  const absTotal = Math.abs(totalAmount);

  const end = new Date(endDate);
  const now = new Date();

  // Calculate total months of the installment plan
  const totalMonths = Math.max(1, Math.round(absTotal / absMonthly));

  // Calculate remaining months from now to end date
  const remainingMonths = Math.max(
    0,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  );

  // Calculate paid months
  const paidMonths = Math.max(0, totalMonths - remainingMonths);
  const paidAmount = paidMonths * absMonthly;
  const progress = Math.min(100, Math.round((paidMonths / totalMonths) * 100));

  return { progress, remainingMonths, paidAmount };
};

export default function Prelevement() {
  const [prelevements, setPrelevements] = useState<PrelevementType[]>([]);
  const [editingPrelevement, setEditingPrelevement] = useState<PrelevementType | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    day: "",
    amount: "",
    category: "autre" as Category,
    isInstallment: false,
    endDate: "",
    totalAmount: "",
  });
  const [newPrelevement, setNewPrelevement] = useState({
    title: "",
    day: "",
    amount: "",
    category: "autre" as Category,
    isInstallment: false,
    endDate: "",
    totalAmount: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isOnline,
    cachePrelevements,
    getCachedPrelevements,
    queueAction,
  } = useOfflineSync();

  const fetchPrelevements = useCallback(async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/prelevements");
        if (response.ok) {
          const data = await response.json();
          setPrelevements(data);
          await cachePrelevements(data);
        }
      } else {
        // Offline - use cached data
        const cached = await getCachedPrelevements();
        setPrelevements(cached);
      }
    } catch {
      // Network error - try cache
      const cached = await getCachedPrelevements();
      setPrelevements(cached);
    } finally {
      setIsLoaded(true);
    }
  }, [isOnline, cachePrelevements, getCachedPrelevements]);

  useEffect(() => {
    fetchPrelevements();
  }, [fetchPrelevements]);

  const toggleAll = async () => {
    const allCompleted = prelevements.every((p) => p.completed);
    setIsLoading(true);

    // Optimistic update
    const updatedPrelevements = prelevements.map((p) => ({
      ...p,
      completed: !allCompleted,
    }));
    setPrelevements(updatedPrelevements);
    await cachePrelevements(updatedPrelevements);

    try {
      if (isOnline) {
        const response = await fetch("/api/prelevements/toggle-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !allCompleted }),
        });
        if (response.ok) {
          const data = await response.json();
          setPrelevements(data);
          await cachePrelevements(data);
        }
      } else {
        await queueAction("toggle-all", { completed: !allCompleted });
      }
    } catch {
      await queueAction("toggle-all", { completed: !allCompleted });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePrelevement = async (id: number) => {
    const prelevement = prelevements.find((p) => p.id === id);
    if (!prelevement) return;

    // Optimistic update
    const updatedPrelevements = prelevements.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    setPrelevements(updatedPrelevements);
    await cachePrelevements(updatedPrelevements);

    try {
      if (isOnline) {
        const response = await fetch(`/api/prelevements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !prelevement.completed }),
        });
        if (response.ok) {
          const updatedPrelevement = await response.json();
          const newList = prelevements.map((p) =>
            p.id === id ? updatedPrelevement : p
          );
          setPrelevements(newList);
          await cachePrelevements(newList);
        }
      } else {
        await queueAction("update", {
          id,
          data: { completed: !prelevement.completed },
        });
      }
    } catch {
      await queueAction("update", {
        id,
        data: { completed: !prelevement.completed },
      });
    }
  };

  const deletePrelevement = async (id: number) => {
    // Optimistic update
    const filtered = prelevements.filter((p) => p.id !== id);
    setPrelevements(filtered);
    await cachePrelevements(filtered);

    try {
      if (isOnline) {
        const response = await fetch(`/api/prelevements/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          // Revert on failure
          await fetchPrelevements();
        }
      } else {
        await queueAction("delete", id);
      }
    } catch {
      await queueAction("delete", id);
    }
  };

  const startEdit = (prelevement: PrelevementType) => {
    setEditingPrelevement(prelevement);
    setEditForm({
      title: prelevement.title,
      day: prelevement.day.toString(),
      amount: prelevement.amount.toString(),
      category: (prelevement.category || "autre") as Category,
      isInstallment: !!(prelevement.endDate || prelevement.totalAmount),
      endDate: prelevement.endDate ? new Date(prelevement.endDate).toISOString().split("T")[0] : "",
      totalAmount: prelevement.totalAmount?.toString() || "",
    });
  };

  const saveEdit = async () => {
    if (!editingPrelevement) return;
    const id = editingPrelevement.id;

    const newAmount = Number.parseFloat(editForm.amount);
    const newDay = Number.parseInt(editForm.day);
    if (isNaN(newAmount) || isNaN(newDay) || !editForm.title.trim()) {
      return;
    }

    const updatePayload = {
      title: editForm.title.trim(),
      day: newDay,
      amount: newAmount,
      category: editForm.category,
      endDate: editForm.isInstallment && editForm.endDate ? editForm.endDate : null,
      totalAmount:
        editForm.isInstallment && editForm.totalAmount
          ? Number.parseFloat(editForm.totalAmount)
          : null,
    };

    // Optimistic update
    const updatedPrelevements = prelevements.map((p) =>
      p.id === id ? { ...p, ...updatePayload } : p
    );
    setPrelevements(updatedPrelevements);
    await cachePrelevements(updatedPrelevements);

    try {
      if (isOnline) {
        const response = await fetch(`/api/prelevements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        if (response.ok) {
          const updatedPrelevement = await response.json();
          const newList = prelevements.map((p) =>
            p.id === id ? updatedPrelevement : p
          );
          setPrelevements(newList);
          await cachePrelevements(newList);
        }
      } else {
        await queueAction("update", { id, data: updatePayload });
      }
    } catch {
      await queueAction("update", { id, data: updatePayload });
    }
    setEditingPrelevement(null);
  };

  const cancelEdit = () => {
    setEditingPrelevement(null);
  };

  const addPrelevement = async () => {
    if (!newPrelevement.title || !newPrelevement.day || !newPrelevement.amount) {
      return;
    }

    const payload = {
      title: newPrelevement.title,
      day: Number.parseInt(newPrelevement.day),
      amount: Number.parseFloat(newPrelevement.amount),
      category: newPrelevement.category,
      endDate:
        newPrelevement.isInstallment && newPrelevement.endDate
          ? newPrelevement.endDate
          : null,
      totalAmount:
        newPrelevement.isInstallment && newPrelevement.totalAmount
          ? Number.parseFloat(newPrelevement.totalAmount)
          : null,
    };

    // Optimistic update with temporary ID
    const tempId = Date.now();
    const tempItem: PrelevementType = {
      id: tempId,
      ...payload,
      completed: false,
    };
    const withTemp = [...prelevements, tempItem];
    setPrelevements(withTemp);

    try {
      if (isOnline) {
        const response = await fetch("/api/prelevements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const newItem = await response.json();
          const newList = withTemp.map((p) => (p.id === tempId ? newItem : p));
          setPrelevements(newList);
          await cachePrelevements(newList);
        }
      } else {
        await cachePrelevements(withTemp);
        await queueAction("create", payload);
      }
    } catch {
      await cachePrelevements(withTemp);
      await queueAction("create", payload);
    }

    setNewPrelevement({ title: "", day: "", amount: "", category: "autre", isInstallment: false, endDate: "", totalAmount: "" });
    setShowAddForm(false);
  };

  const confirmReset = async () => {
    setShowResetDialog(false);
    setIsLoading(true);
    try {
      if (isOnline) {
        const response = await fetch("/api/prelevements/reset", {
          method: "POST",
        });
        if (response.ok) {
          const data = await response.json();
          setPrelevements(data);
          await cachePrelevements(data);
        }
      } else {
        await queueAction("reset", null);
      }
    } catch {
      await queueAction("reset", null);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAVenir = prelevements
    .filter((p) => !p.completed)
    .reduce((sum, p) => sum + p.amount, 0);

  const allCompleted = prelevements.length > 0 && prelevements.every((p) => p.completed);

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-error";
  };

  if (!isLoaded) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout onAddClick={() => setShowAddForm(true)}>
      <div className="max-w-4xl mx-auto py-4">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <CardTitle className="text-xl sm:text-2xl">
                Gestion des Prélèvements
              </CardTitle>
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                size="sm"
                className="text-destructive bg-transparent self-start sm:self-auto"
                disabled={isLoading}
              >
                Réinitialiser
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toggle-all"
                  checked={allCompleted}
                  onCheckedChange={toggleAll}
                  disabled={isLoading || prelevements.length === 0}
                />
                <label
                  htmlFor="toggle-all"
                  className="text-sm text-muted-foreground"
                >
                  {allCompleted ? "Tout décocher" : "Tout cocher"}
                </label>
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
                className="sm:hidden"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {showAddForm && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div>
                  <h3 className="font-semibold text-base">Nouveau prélèvement</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Renseigne les infos du prélèvement récurrent. Les montants négatifs
                    représentent des revenus (ex : CAF, salaire).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium">Intitulé</label>
                    <Input
                      placeholder="Ex : SFR, Loyer, Scooter..."
                      value={newPrelevement.title}
                      onChange={(e) =>
                        setNewPrelevement({
                          ...newPrelevement,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jour du mois</label>
                    <Input
                      type="number"
                      placeholder="1 - 31"
                      min="1"
                      max="31"
                      value={newPrelevement.day}
                      onChange={(e) =>
                        setNewPrelevement({
                          ...newPrelevement,
                          day: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Jour de prélèvement sur le compte.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Montant mensuel (€)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex : 29.99 ou -75 pour un revenu"
                      value={newPrelevement.amount}
                      onChange={(e) =>
                        setNewPrelevement({
                          ...newPrelevement,
                          amount: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Utilise un montant négatif pour un revenu.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium">Catégorie</label>
                    <select
                      value={newPrelevement.category}
                      onChange={(e) =>
                        setNewPrelevement({
                          ...newPrelevement,
                          category: e.target.value as Category,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="installment-new"
                      checked={newPrelevement.isInstallment}
                      onCheckedChange={(checked) =>
                        setNewPrelevement({
                          ...newPrelevement,
                          isInstallment: checked === true,
                        })
                      }
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="installment-new"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Paiement étalé sur plusieurs mois
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Coche cette case pour un achat remboursé en plusieurs fois
                        (crédit, scooter, Dyson, Apple...). Tu verras la progression du
                        remboursement.
                      </p>
                    </div>
                  </div>

                  {newPrelevement.isInstallment && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pl-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Date de fin</label>
                        <Input
                          type="date"
                          value={newPrelevement.endDate}
                          onChange={(e) =>
                            setNewPrelevement({
                              ...newPrelevement,
                              endDate: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Dernière mensualité prévue.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Montant total (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex : 3600 pour un scooter"
                          value={newPrelevement.totalAmount}
                          onChange={(e) =>
                            setNewPrelevement({
                              ...newPrelevement,
                              totalAmount: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Coût total de l&apos;achat, toutes mensualités cumulées.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={addPrelevement}
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Valider
                  </Button>
                </div>
              </div>
            )}

            {/* Desktop Table Header - Hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-6 gap-4 p-3 bg-muted rounded-lg font-semibold text-muted-foreground">
              <div>Titre</div>
              <div>Catégorie</div>
              <div>Jour</div>
              <div>Montant</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>

            {/* Prélèvements à venir */}
            {(() => {
              const sorted = [...prelevements].sort((a, b) => a.day - b.day);
              const pending = sorted.filter((p) => !p.completed);
              const completed = sorted.filter((p) => p.completed);

              const renderItem = (prelevement: PrelevementType) => (
                <div
                  key={prelevement.id}
                  className={`border rounded-lg p-4 ${
                    prelevement.completed
                      ? "bg-muted/50 text-muted-foreground"
                      : "bg-card"
                  }`}
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-medium text-base ${
                              prelevement.completed ? "line-through" : ""
                            }`}
                          >
                            {prelevement.title}
                          </h3>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[prelevement.category as Category] || CATEGORY_COLORS.autre}20`,
                              color: CATEGORY_COLORS[prelevement.category as Category] || CATEGORY_COLORS.autre,
                            }}
                          >
                            {CATEGORY_LABELS[prelevement.category as Category] || prelevement.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-muted-foreground">
                            Jour {prelevement.day.toString().padStart(2, "0")}
                          </span>
                          <span
                            className={`font-mono font-medium ${getAmountColor(
                              prelevement.amount
                            )} ${prelevement.completed ? "opacity-60" : ""}`}
                          >
                            {prelevement.amount.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                      <Checkbox
                        checked={prelevement.completed}
                        onCheckedChange={() =>
                          togglePrelevement(prelevement.id)
                        }
                      />
                    </div>

                    {/* Credit Progress Bar - Mobile */}
                    {(() => {
                      const creditInfo = calculateInstallmentProgress(
                        prelevement.endDate,
                        prelevement.totalAmount,
                        prelevement.amount
                      );
                      if (!creditInfo) return null;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {creditInfo.remainingMonths} mois restants
                            </span>
                            <span>{creditInfo.progress}%</span>
                          </div>
                          <Progress value={creditInfo.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {creditInfo.paidAmount.toFixed(0)}€ / {prelevement.totalAmount?.toFixed(0)}€
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => startEdit(prelevement)}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deletePrelevement(prelevement.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-6 gap-4 items-center">
                    <div
                      className={`font-medium ${
                        prelevement.completed ? "line-through" : ""
                      }`}
                    >
                      {prelevement.title}
                    </div>
                    <div>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[prelevement.category as Category] || CATEGORY_COLORS.autre}20`,
                          color: CATEGORY_COLORS[prelevement.category as Category] || CATEGORY_COLORS.autre,
                        }}
                      >
                        {CATEGORY_LABELS[prelevement.category as Category] || prelevement.category}
                      </span>
                    </div>
                    <div>{prelevement.day.toString().padStart(2, "0")}</div>
                    <div className="font-mono">
                      <span className={getAmountColor(prelevement.amount)}>
                        {prelevement.amount.toFixed(2)} €
                      </span>
                    </div>
                    <div>
                      <Checkbox
                        checked={prelevement.completed}
                        onCheckedChange={() =>
                          togglePrelevement(prelevement.id)
                        }
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => startEdit(prelevement)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deletePrelevement(prelevement.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Credit Progress Bar - Desktop */}
                  {(() => {
                    const creditInfo = calculateInstallmentProgress(
                      prelevement.endDate,
                      prelevement.totalAmount,
                      prelevement.amount
                    );
                    if (!creditInfo) return null;
                    return (
                      <div className="hidden lg:block mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {creditInfo.remainingMonths} mois restants
                          </div>
                          <div className="flex-1">
                            <Progress value={creditInfo.progress} className="h-2" />
                          </div>
                          <div className="text-xs text-muted-foreground min-w-[100px] text-right">
                            {creditInfo.paidAmount.toFixed(0)}€ / {prelevement.totalAmount?.toFixed(0)}€ ({creditInfo.progress}%)
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );

              return (
                <>
                  {/* Total à venir */}
                  <div className="p-5 rounded-xl border-2 border-primary bg-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-primary">Total à venir</span>
                      <span className="text-2xl font-bold text-primary">
                        {Math.abs(totalAVenir).toFixed(2)} €
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isOnline
                        ? "Données synchronisées avec la base de données"
                        : "Mode hors ligne - données locales"}
                    </div>
                  </div>

                  {/* Liste des prélèvements à venir */}
                  {pending.length > 0 && (
                    <div className="flex items-center gap-2 pb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Reste à prélever ({pending.length})
                      </span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {pending.map(renderItem)}
                  </div>

                  {/* Liste des prélèvements déjà prélevés */}
                  {completed.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-2">
                        <Check className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Déjà prélevés ({completed.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {completed.map(renderItem)}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPrelevement} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le prélèvement</DialogTitle>
            <DialogDescription>
              Modifiez les informations du prélèvement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input
                placeholder="Titre"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jour du mois</label>
              <Input
                type="number"
                placeholder="Jour (1-31)"
                min="1"
                max="31"
                value={editForm.day}
                onChange={(e) =>
                  setEditForm({ ...editForm, day: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Montant</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Montant (- pour revenu)"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    category: e.target.value as Category,
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="installment-edit"
                checked={editForm.isInstallment}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isInstallment: checked === true })
                }
              />
              <div className="space-y-1">
                <label
                  htmlFor="installment-edit"
                  className="text-sm font-medium cursor-pointer"
                >
                  Paiement étalé sur plusieurs mois
                </label>
                <p className="text-xs text-muted-foreground">
                  Pour un achat remboursé en plusieurs fois (crédit, scooter, etc.).
                </p>
              </div>
            </div>
            {editForm.isInstallment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pl-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de fin</label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Montant total (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Coût total de l'achat"
                    value={editForm.totalAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalAmount: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelEdit}>
              Annuler
            </Button>
            <Button onClick={saveEdit}>
              <Check className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Réinitialiser les données
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              Cette action va supprimer tous vos prélèvements actuels et les
              remplacer par les données par défaut (seed).
              <br />
              <br />
              <strong>Toutes vos modifications seront perdues.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReset}
              disabled={isLoading}
            >
              {isLoading ? "Réinitialisation..." : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
