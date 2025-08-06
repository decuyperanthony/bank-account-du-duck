export type PrelevementType = {
  id: number;
  title: string;
  day: number;
  amount: number;
  completed: boolean;
};

export const defaultPrelevements = [
  { id: 1, title: "SFR", day: 2, amount: -33.99, completed: false }, //
  { id: 2, title: "SFR", day: 4, amount: -1.99, completed: false }, //
  { id: 3, title: "Canal +", day: 4, amount: -45.99, completed: false }, //
  { id: 4, title: "SFR", day: 5, amount: -37.85, completed: false }, //
  { id: 5, title: "CAF", day: 5, amount: 75.53, completed: false }, //
  { id: 17, title: "Spotify", day: 5, amount: -17.2, completed: false }, //
  { id: 6, title: "Amazon Prime", day: 5, amount: -6.99, completed: false }, //
  { id: 7, title: "Scooter", day: 5, amount: -166.59, completed: false }, //
  { id: 8, title: "SFR", day: 5, amount: -8.99, completed: false }, //
  { id: 9, title: "Climatiseur", day: 6, amount: -69.9, completed: false }, //
  { id: 10, title: "L'equipe", day: 6, amount: -3.99, completed: false }, //
  { id: 11, title: "Apple 2TO", day: 10, amount: -9.99, completed: false }, //
  { id: 12, title: "Loyer", day: 10, amount: -1100.0, completed: false }, //
  { id: 13, title: "MAIF", day: 10, amount: -94.03, completed: false }, //
  {
    id: 14,
    title: "Science et vie junior",
    day: 12,
    amount: -5.44,
    completed: false,
  }, //
  { id: 15, title: "EDF", day: 16, amount: -135.0, completed: false }, //
  { id: 16, title: "Impot", day: 16, amount: -38.0, completed: false }, //
] satisfies PrelevementType[];
