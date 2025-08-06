"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit2, Check, X, Plus } from "lucide-react";

interface Prelevement {
  id: number;
  title: string;
  day: number;
  amount: number;
  completed: boolean;
}

const defaultPrelevements: Prelevement[] = [
  { id: 1, title: "SFR", day: 2, amount: 33.99, completed: false },
  { id: 2, title: "SFR", day: 4, amount: 1.99, completed: false },
  { id: 3, title: "Canal +", day: 4, amount: 45.99, completed: false },
  { id: 4, title: "SFR", day: 5, amount: 37.85, completed: false },
  { id: 5, title: "CAF", day: 5, amount: -75.53, completed: false },
  { id: 6, title: "Spotify", day: 5, amount: 17.2, completed: false },
  { id: 6, title: "Amazon Prime", day: 5, amount: 6.99, completed: false },
  { id: 7, title: "Scooter", day: 5, amount: 166.59, completed: false },
  { id: 8, title: "SFR", day: 5, amount: 9.99, completed: false },
  { id: 9, title: "Climatiseur", day: 6, amount: 69.9, completed: false },
  { id: 10, title: "L'equipe", day: 6, amount: 3.99, completed: false },
  { id: 11, title: "Apple 2TO", day: 10, amount: 9.99, completed: false },
  { id: 12, title: "Loyer", day: 10, amount: 1100.0, completed: false },
  { id: 13, title: "MAIF", day: 10, amount: 94.03, completed: false },
  {
    id: 14,
    title: "Science et vie junior",
    day: 12,
    amount: 5.44,
    completed: false,
  },
  { id: 15, title: "EDF", day: 16, amount: 135.0, completed: false },
  { id: 16, title: "Impot", day: 16, amount: 38.0, completed: false },
];

export default function Prelevement() {
  const [prelevements, setPrelevements] = useState<Prelevement[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [newPrelevement, setNewPrelevement] = useState({
    title: "",
    day: "",
    amount: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPrelevements = localStorage.getItem("prelevements");
    if (savedPrelevements) {
      try {
        setPrelevements(JSON.parse(savedPrelevements));
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setPrelevements(defaultPrelevements);
      }
    } else {
      setPrelevements(defaultPrelevements);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("prelevements", JSON.stringify(prelevements));
    }
  }, [prelevements, isLoaded]);

  const toggleAll = () => {
    const allCompleted = prelevements.every((p) => p.completed);
    setPrelevements(
      prelevements.map((p) => ({ ...p, completed: !allCompleted }))
    );
  };

  const togglePrelevement = (id: number) => {
    setPrelevements(
      prelevements.map((p) =>
        p.id === id ? { ...p, completed: !p.completed } : p
      )
    );
  };

  const deletePrelevement = (id: number) => {
    setPrelevements(prelevements.filter((p) => p.id !== id));
  };

  const startEdit = (id: number, amount: number) => {
    setEditingId(id);
    setEditAmount(amount.toString());
  };

  const saveEdit = (id: number) => {
    const newAmount = Number.parseFloat(editAmount);
    if (!isNaN(newAmount)) {
      setPrelevements(
        prelevements.map((p) => (p.id === id ? { ...p, amount: newAmount } : p))
      );
    }
    setEditingId(null);
    setEditAmount("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const addPrelevement = () => {
    if (newPrelevement.title && newPrelevement.day && newPrelevement.amount) {
      const newId =
        prelevements.length > 0
          ? Math.max(...prelevements.map((p) => p.id)) + 1
          : 1;
      setPrelevements([
        ...prelevements,
        {
          id: newId,
          title: newPrelevement.title,
          day: Number.parseInt(newPrelevement.day),
          amount: Number.parseFloat(newPrelevement.amount),
          completed: false,
        },
      ]);
      setNewPrelevement({ title: "", day: "", amount: "" });
      setShowAddForm(false);
    }
  };

  const resetData = () => {
    if (
      confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")
    ) {
      setPrelevements(defaultPrelevements);
    }
  };

  const totalAVenir = prelevements
    .filter((p) => !p.completed)
    .reduce((sum, p) => sum + p.amount, 0);

  const allCompleted = prelevements.every((p) => p.completed);

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
                  placeholder="Montant"
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
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>
                            Jour {prelevement.day.toString().padStart(2, "0")}
                          </span>
                          <span
                            className={`font-mono font-medium ${
                              prelevement.amount < 0 ? "text-green-600" : ""
                            } ${
                              prelevement.completed ? "" : "text-foreground"
                            }`}
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
                        <span
                          className={
                            prelevement.amount < 0 ? "text-green-600" : ""
                          }
                        >
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
              <span
                className={`text-xl font-bold ${
                  totalAVenir < 0 ? "text-green-600" : ""
                }`}
              >
                {totalAVenir.toFixed(2)} €
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Données sauvegardées automatiquement
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
