# Fish Farm Anosy — frontend

Interface web de pilotage piscicole (Next.js, React, TypeScript), branchée sur l'API Django REST du dépôt `fish_farm-backend`.

## Prérequis

- Node.js 20.9.0 ou plus récent, et npm.
- Le backend lancé (par défaut sur `http://localhost:8000`) : voir le README du dépôt `fish_farm-backend`.

## Configuration

Créer `.env.local` à la racine :

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Lancement

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

Avec Docker : voir [README_DOCKER.md](README_DOCKER.md).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Version de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires (Vitest) |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) : routes, organisation par domaine, socle commun, conventions.
- [docs/INTEGRATION.md](docs/INTEGRATION.md) : état de l'intégration écran par écran, écarts avec le backend.
- [docs/RECETTE.md](docs/RECETTE.md) : données de test et checklists de recette par rôle.
- Règles d'API et matrice des droits : [guide d'intégration du backend](../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md) (source de référence).
- Historique : [docs/archives/](docs/archives/).
