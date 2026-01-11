"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit2, Check, X, Plus } from "lucide-react";

type PrelevementType = {
  id: number;
  title: string;
  day: number;
  amount: number;
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
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrelevements = useCallback(async () => {
    try {
      const response = await fetch("/api/prelevements");
      if (response.ok) {
        const data = await response.json();
        setPrelevements(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchPrelevements();
  }, [fetchPrelevements]);

  const toggleAll = async () => {
    const allCompleted = prelevements.every((p) => p.completed);
    setIsLoading(true);
    try {
      const response = await fetch("/api/prelevements/toggle-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !allCompleted }),
      });
      if (response.ok) {
        const data = await response.json();
        setPrelevements(data);
      }
    } catch (error) {
      console.error("Erreur lors du toggle all:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePrelevement = async (id: number) => {
    const prelevement = prelevements.find((p) => p.id === id);
    if (!prelevement) return;

    try {
      const response = await fetch(`/api/prelevements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !prelevement.completed }),
      });
      if (response.ok) {
        const updatedPrelevement = await response.json();
        setPrelevements(
          prelevements.map((p) => (p.id === id ? updatedPrelevement : p))
        );
      }
    } catch (error) {
      console.error("Erreur lors du toggle:", error);
    }
  };

  const deletePrelevement = async (id: number) => {
    try {
      const response = await fetch(`/api/prelevements/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPrelevements(prelevements.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
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

    try {
      const response = await fetch(`/api/prelevements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: newAmount }),
      });
      if (response.ok) {
        const updatedPrelevement = await response.json();
        setPrelevements(
          prelevements.map((p) => (p.id === id ? updatedPrelevement : p))
        );
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
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

    try {
      const response = await fetch("/api/prelevements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPrelevement.title,
          day: Number.parseInt(newPrelevement.day),
          amount: Number.parseFloat(newPrelevement.amount),
        }),
      });
      if (response.ok) {
        const newItem = await response.json();
        setPrelevements([...prelevements, newItem]);
        setNewPrelevement({ title: "", day: "", amount: "" });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  const resetData = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/prelevements/reset", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setPrelevements(data);
      }
    } catch (error) {
      console.error("Erreur lors du reset:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAVenir = prelevements
    .filter((p) => !p.completed)
    .reduce((sum, p) => sum + p.amount, 0);

  const allCompleted = prelevements.length > 0 && prelevements.every((p) => p.completed);

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-green-600" : "text-red-600";
  };

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-background min-h-screen">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <CardTitle className="text-xl sm:text-2xl">
              Gestion des Prélèvements
            </CardTitle>
            <Button
              onClick={resetData}
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  placeholder="Jour"
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
                <div className="flex space-x-2 sm:col-span-1 lg:col-span-1">
                  <Button
                    onClick={addPrelevement}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Check className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Valider</span>
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <X className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Annuler</span>
                  </Button>
                </div>
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
            {prelevements
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
              Données synchronisées avec la base de données
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
