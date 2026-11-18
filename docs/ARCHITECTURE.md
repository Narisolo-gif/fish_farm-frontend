# Architecture du frontend

État au 2026-11-18. Les règles d'API (routes, droits, formats) ne sont pas décrites ici : elles sont dans le [guide d'intégration du backend](../../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md).

## Routes (`src/app/`)

Chaque `page.tsx` reste mince : il assemble des composants importés depuis `src/app/features/`.

| Route | Rôle |
|---|---|
| `/` | Accueil |
| `/login`, `/change-password` | Connexion, changement de mot de passe (obligatoire si `must_change_password`) |
| `/admin` | Accueil de l'administration |
| `/admin/users`, `/admin/users/new` | Comptes utilisateurs |
| `/admin/orders`, `/admin/orders/[reference]` | Commandes (maquette, sans API) |
| `/dashboard` | Indicateurs |
| `/production` | Accueil du module Production |
| `/production/reproduction` | Reproductions et pontes |
| `/production/ecloserie`, `/nouveau` | Éclosions |
| `/production/lots`, `/new`, `/[lotId]`, `/[lotId]/modifier` | Lots |
| `/production/traitement`, `/nouveau`, `/[traitementId]` | Traitements |
| `/production/stock`, `/nouveau`, `/[lotStockageId]` | Mises en stock |
| `/production/grossissement`, `/nouveau`, `/[grossissementId]`, `/suivi`, `/historique` | Grossissement |
| `/bassins`, `/new`, `/[bassinId]` | Bassins et hapas |
| `/environnement/new` | Mesure environnementale |
| `/provende`, `/new` | Stock de provendes |

## Domaines (`src/app/features/production/`)

Un dossier par domaine métier, avec seulement les sous-dossiers utiles : `components/`, `hooks/`, `services/` (appels API), `types/`.

- Domaines : `reproduction`, `ecloserie`, `lots`, `traitement`, `stocks`, `grossissements`.
- `shared/` : ce qui sert à plusieurs domaines :
  - `bassins` : bassins, hapas et sélecteurs ;
  - `environnement` : mesures ;
  - `lot` : sélecteur et badge de lot ;
  - `ponte` ;
  - `mortalite-ui` : mortalités, pertes et mouvements du registre ;
  - `provende-ui` : distributions de provende ;
  - `dashboard-ui`, `plan-ui` : éléments d'affichage ;
  - `data` : enregistrements locaux, à retirer.

Composants génériques sans logique métier (coque, en-têtes, tableau, pagination) : `src/components/`. Hooks génériques : `src/app/hooks/`.

## Socle (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `session.ts` | Jetons d'accès et de rafraîchissement : seul fichier qui touche `localStorage` pour eux. |
| `apiClient.ts` | `apiRequest` : URL de base (`NEXT_PUBLIC_API_URL`), jeton ajouté automatiquement, un seul rafraîchissement sur 401 ; `logout`. |
| `apiErrors.ts` | `ApiError` et normalisation des erreurs (champ → messages, `detail`, `non_field_errors`, 403). |
| `permissions.ts` | Copie de la matrice des droits du backend ; `can(role, ressource, action)`. |
| `currentUser.ts` | Utilisateur courant (`/api/auth/me/`), `useCurrentUser`, `useCan`. |
| `formatters.ts` | Décimaux reçus en chaîne, dates `AAAA-MM-JJ` (fuseau Indian/Antananarivo), listes. |

## Conventions

- Tout appel réseau passe par `apiRequest` ; un service par domaine, dans `services/`.
- Aucune lecture du jeton hors de `session.ts`.
- Un bouton d'action n'est affiché que si `useCan(ressource, action)` le permet ; le backend reste l'autorité (traiter le 403).
- Les valeurs calculées par le backend (effectifs, taux, poids moyens, aperçus) sont affichées telles quelles, pas recalculées.
- Les erreurs de formulaire sont affichées par champ (`ApiError.fieldErrors`).

## Dette connue

- `src/app/features/production/shared/data/localProductionRecords.ts` : données conservées dans le navigateur, à remplacer par l'API.
- `src/lib/data.ts` : données de maquette (accueil, administration, commandes, sélecteurs).
- Pages qui appellent encore `fetch` ou lisent le jeton elles-mêmes : à migrer vers `apiRequest`.
