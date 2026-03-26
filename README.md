# Bank Account du Duck

> Application web de gestion des prelevements bancaires recurrents — abonnements, loyer, credits, impots — avec une vision claire de ses depenses mensuelles.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)

---

## Apercu

<!-- Ajoute tes screenshots ici (glisse-les dans le dossier docs/ ou utilise des liens directs) -->

| Dashboard | Statistiques | Calendrier |
|:-:|:-:|:-:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Stats](docs/screenshots/stats.png) | ![Calendar](docs/screenshots/calendar.png) |

> **Pour ajouter tes screenshots :** cree un dossier `docs/screenshots/` et places-y tes images (`dashboard.png`, `stats.png`, `calendar.png`). Supprime ensuite ce bloc de texte.

---

## Pourquoi ce projet ?

Beaucoup d'applications bancaires montrent l'historique des transactions, mais aucune ne donne une **vue d'ensemble claire et interactive** des prelevements recurrents. Bank Account du Duck permet de :

- Visualiser **tous ses prelevements** du mois sur une seule page
- Suivre ce qui a **deja ete preleve** vs ce qui **reste a venir**
- Analyser ses depenses par **categorie** avec des statistiques detaillees
- Consulter un **calendrier** des prelevements a venir
- Fonctionner **hors-ligne** grace au mode PWA avec synchronisation automatique

---

## Fonctionnalites

### Dashboard principal
- Liste des prelevements du mois, separes en "a venir" et "deja preleves"
- Total mensuel avec vue d'ensemble en temps reel
- Marquage rapide d'un prelevement comme effectue (checkbox)
- CRUD complet : ajout, modification, suppression de prelevements

### Statistiques
- Repartition des depenses par categorie (telecom, logement, streaming, etc.)
- Vue detaillee avec montants et pourcentages
- Suivi des revenus vs depenses
- Gestion d'un budget courses personnalise

### Calendrier
- Vue mensuelle avec indication des jours de prelevement
- Navigation entre les mois
- Detail des prelevements au clic sur un jour
- Filtrage automatique des credits arrives a echeance

### Reglages
- Verification du statut de connexion a la base de donnees
- Export des donnees au format JSON
- Theme clair / sombre
- Statut de connexion en temps reel

### PWA & Offline
- Installation sur mobile comme une app native
- Mode offline avec stockage IndexedDB
- Synchronisation automatique au retour en ligne

### Authentification
- Connexion securisee via Supabase Auth (email/password)
- Middleware de protection des routes
- Reset de mot de passe

---

## Stack technique

| Couche | Technologie |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 + Radix UI |
| **Base de donnees** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | Supabase Auth |
| **Validation** | Zod |
| **PWA** | next-pwa + IndexedDB |
| **Icons** | Lucide React |

---

## Architecture

```
app/
  api/
    prelevements/       # CRUD + toggle + reset
    db-status/          # Health check DB
    export/             # Export JSON
  calendar/             # Vue calendrier
  stats/                # Statistiques par categorie
  settings/             # Reglages utilisateur
  login/                # Authentification

components/
  layout/               # Header, BottomNav, PageLayout
  ui/                   # Design system (Button, Card, Dialog, etc.)

db/
  schema.ts             # Schema Drizzle (table prelevements)
  seed.ts               # Donnees de demonstration

lib/
  categories.ts         # Categories et couleurs
  routes.ts             # Constantes de routes
  offline-db.ts         # IndexedDB pour le mode offline
  supabase/             # Clients Supabase (client + server)

hooks/
  useOfflineSync.ts     # Hook de synchronisation offline
```

---

## Modele de donnees

### Table `prelevements`

| Colonne | Type | Description |
|---|---|---|
| `id` | `serial` | Cle primaire |
| `title` | `text` | Nom du prelevement |
| `day` | `integer` | Jour du mois (1-31) |
| `amount` | `real` | Montant (negatif = revenu) |
| `category` | `text` | Categorie |
| `completed` | `boolean` | Preleve ce mois-ci |
| `end_date` | `timestamp` | Date de fin (credits) |
| `total_amount` | `real` | Montant total du credit |
| `created_at` | `timestamp` | Date de creation |
| `updated_at` | `timestamp` | Date de mise a jour |

**9 categories** : telecom, logement, streaming, assurance, transport, credit, impot, revenu, autre

---

## Installation

### Prerequis

- Node.js 18+
- Un compte [Neon](https://neon.tech) (base PostgreSQL serverless)
- Un projet [Supabase](https://supabase.com) (authentification)

### Setup

```bash
# Cloner le repo
git clone https://github.com/decuyperanthony/bank-account-du-duck.git
cd bank-account-du-duck

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Pousser le schema vers la DB
npx drizzle-kit push

# (Optionnel) Peupler avec des donnees de demo
npx tsx db/seed.ts

# Lancer le serveur de developpement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de dev (Turbopack) |
| `npm run build` | Build de production |
| `npm run lint` | Linter ESLint |
| `npm run db:push` | Push du schema vers la DB |
| `npm run db:seed` | Seed des donnees de demo |
| `npm run db:studio` | Interface Drizzle Studio |
| `npm run generate:pwa` | Generation des icones PWA |

---

## Licence

MIT
