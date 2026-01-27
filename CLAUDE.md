# Bank Account du Duck

Application de gestion des prélèvements bancaires récurrents (abonnements, loyer, crédits, etc.).

## Stack technique

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth (email/password)
- **Styling**: Tailwind CSS 4 + Radix UI
- **PWA**: Offline-first avec IndexedDB

## Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Lint
npm run lint

# Seed la base de données (après modification du schéma)
npx tsx db/seed.ts

# Push le schéma vers la DB
npx drizzle-kit push
```

## Structure du projet

```
/app                  # Next.js App Router
  /api                # API routes
    /prelevements     # CRUD prélèvements
    /db-status        # Status DB
    /export           # Export JSON
  /settings           # Page réglages
  /stats              # Page statistiques
  /login              # Auth pages
/components
  /layout             # Header, BottomNav, PageLayout
  /ui                 # Composants réutilisables (Button, Card, etc.)
/db
  schema.ts           # Schéma Drizzle (table prelevements)
  seed.ts             # Données de seed
/lib
  routes.ts           # Constantes des routes
  offline-db.ts       # IndexedDB pour mode offline
  supabase/           # Clients Supabase
/hooks
  useOfflineSync.ts   # Hook de synchronisation offline
```

## Base de données

### Table `prelevements`

| Colonne    | Type      | Description                                      |
|------------|-----------|--------------------------------------------------|
| id         | serial    | Clé primaire                                     |
| title      | text      | Nom du prélèvement (ex: "SFR", "Loyer")          |
| day        | integer   | Jour du mois (1-31)                              |
| amount     | real      | Montant (négatif = revenu, ex: CAF)              |
| category   | text      | Catégorie (telecom, logement, streaming, etc.)   |
| completed  | boolean   | Marque si payé ce mois                           |
| createdAt  | timestamp | Date de création                                 |
| updatedAt  | timestamp | Date de mise à jour                              |

### Catégories disponibles

- `telecom` - Téléphonie, internet (SFR, Orange, Free...)
- `logement` - Loyer, charges, EDF, eau...
- `streaming` - Netflix, Canal+, Amazon Prime, Spotify...
- `assurance` - MAIF, AXA, mutuelles...
- `transport` - Crédit voiture, scooter, essence...
- `credit` - Crédits conso, Dyson, Apple...
- `impot` - Impôts sur le revenu, taxe foncière...
- `revenu` - CAF, salaire, remboursements...
- `autre` - Autres prélèvements

## Notes importantes

- Les montants négatifs représentent des revenus (ex: CAF = -75.53)
- Le mode offline stocke les données dans IndexedDB et synchronise quand online
- Après modification du schéma DB, il faut run `npx drizzle-kit push` puis `npx tsx db/seed.ts`
