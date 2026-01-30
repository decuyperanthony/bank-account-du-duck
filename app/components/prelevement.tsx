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
import { Trash2, Edit2, Check, X, Plus, AlertTriangle } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";

type PrelevementType = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
};

export default function Prelevement() {
  const [prelevements, setPrelevements] = useState<PrelevementType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [newPrelevement, setNewPrelevement] = useState({
    title: "",
    day: "",
    amount: "",
    category: "autre" as Category,
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

  const startEdit = (id: number, amount: number) => {
    setEditingId(id);
    setEditAmount(amount.toString());
  };

  const saveEdit = async (id: number) => {
    const newAmount = Number.parseFloat(editAmount);
    if (isNaN(newAmount)) {
      cancelEdit();
      return;
    }

    // Optimistic update
    const updatedPrelevements = prelevements.map((p) =>
      p.id === id ? { ...p, amount: newAmount } : p
    );
    setPrelevements(updatedPrelevements);
    await cachePrelevements(updatedPrelevements);

    try {
      if (isOnline) {
        const response = await fetch(`/api/prelevements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: newAmount }),
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
        await queueAction("update", { id, data: { amount: newAmount } });
      }
    } catch {
      await queueAction("update", { id, data: { amount: newAmount } });
    }
    setEditingId(null);
    setEditAmount("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
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

    setNewPrelevement({ title: "", day: "", amount: "", category: "autre" });
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
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Titre"
                    value={newPrelevement.title}
                    onChange={(e) =>
                      setNewPrelevement({
                        ...newPrelevement,
                        title: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Jour (1-31)"
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
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Montant (- pour revenu)"
                    value={newPrelevement.amount}
                    onChange={(e) =>
                      setNewPrelevement({
                        ...newPrelevement,
                        amount: e.target.value,
                      })
                    }
                  />
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
            <div className="hidden lg:grid lg:grid-cols-5 gap-4 p-3 bg-muted rounded-lg font-semibold text-muted-foreground">
              <div>Titre</div>
              <div>Jour</div>
              <div>Montant</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>

            <div className="space-y-3">
              {[...prelevements]
                .sort((a, b) => a.day - b.day)
                .map((prelevement) => (
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
                          <h3
                            className={`font-medium text-base ${
                              prelevement.completed ? "line-through" : ""
                            }`}
                          >
                            {prelevement.title}
                          </h3>
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

                      {editingId === prelevement.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => saveEdit(prelevement.id)}
                            size="sm"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() =>
                              startEdit(prelevement.id, prelevement.amount)
                            }
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
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-center">
                      <div
                        className={`font-medium ${
                          prelevement.completed ? "line-through" : ""
                        }`}
                      >
                        {prelevement.title}
                      </div>
                      <div>{prelevement.day.toString().padStart(2, "0")}</div>
                      <div className="font-mono">
                        {editingId === prelevement.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 h-8"
                            />
                            <Button
                              onClick={() => saveEdit(prelevement.id)}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className={getAmountColor(prelevement.amount)}>
                            {prelevement.amount.toFixed(2)} €
                          </span>
                        )}
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
                        {editingId !== prelevement.id && (
                          <Button
                            onClick={() =>
                              startEdit(prelevement.id, prelevement.amount)
                            }
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
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
                  </div>
                ))}
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-lg font-semibold">Total à venir</span>
                <span className="text-xl font-bold text-foreground">
                  {Math.abs(totalAVenir).toFixed(2)} €
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {isOnline
                  ? "Données synchronisées avec la base de données"
                  : "Mode hors ligne - données locales"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
