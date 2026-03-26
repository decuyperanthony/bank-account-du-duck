export const defaultPrelevements = [
  // Jour 2
  { title: "Opérateur Mobile", day: 2, amount: 19.99, category: "telecom", completed: false },
  // Jour 4
  { title: "Fibre Internet", day: 4, amount: 29.99, category: "telecom", completed: false },
  { title: "TV Premium", day: 4, amount: 39.99, category: "streaming", completed: false },
  { title: "VOD Streaming", day: 4, amount: 5.99, category: "streaming", completed: false },
  {
    title: "Électroménager",
    day: 4,
    amount: 50.00,
    category: "credit",
    completed: false,
    endDate: new Date("2026-06-04"),
    totalAmount: 300,
  },
  // Jour 5
  { title: "Forfait Famille", day: 5, amount: 35.00, category: "telecom", completed: false },
  { title: "Allocations", day: 5, amount: -150.00, category: "revenu", completed: false },
  {
    title: "Crédit Véhicule",
    day: 5,
    amount: 180.00,
    category: "transport",
    completed: false,
    endDate: new Date("2027-05-05"),
    totalAmount: 6000,
  },
  {
    title: "Crédit Mobilier",
    day: 5,
    amount: 150.00,
    category: "credit",
    completed: false,
    endDate: new Date("2026-11-04"),
    totalAmount: 2500,
  },
  { title: "Électricité", day: 5, amount: 120.00, category: "logement", completed: false },
  // Jour 6
  { title: "Forfait Tablette", day: 6, amount: 10.00, category: "telecom", completed: false },
  { title: "Presse en ligne", day: 6, amount: 4.99, category: "streaming", completed: false },
  // Jour 7
  { title: "Assurance Habitation", day: 7, amount: 95.00, category: "assurance", completed: false },
  // Jour 10
  { title: "Cloud Storage", day: 10, amount: 9.99, category: "streaming", completed: false },
  { title: "Loyer", day: 10, amount: 850.00, category: "logement", completed: false },
  // Jour 16
  { title: "Impôts", day: 16, amount: 30.00, category: "impot", completed: false },
  // Jour 21
  {
    title: "Crédit High-Tech",
    day: 21,
    amount: 45.00,
    category: "credit",
    completed: false,
    endDate: new Date("2026-08-21"),
    totalAmount: 500,
  },
  // Jour 23
  { title: "Sport Streaming", day: 23, amount: 15.00, category: "streaming", completed: false },
  // Jour 26
  { title: "Musique Family", day: 26, amount: 16.99, category: "streaming", completed: false },
];
