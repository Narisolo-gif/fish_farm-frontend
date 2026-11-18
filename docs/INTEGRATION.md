# État de l'intégration frontend ↔ backend

État au 2026-11-18. Référence backend : branche `release/1.0.0`, commit `54ffab2` (refonte de l'administration, 2026-11-17).

Les règles d'API (routes, formats, parcours, droits) sont dans le [guide d'intégration du backend](../../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md). Ce document ne les recopie pas : il dit, écran par écran, ce qui est branché et ce qui reste à corriger.

Ordre de priorité en cas d'écart : **code backend et ses tests**, puis `REGLES_DE_GESTION_FISH_FARM.md`, puis le guide. Le frontend suit le code ; les écarts sont listés ci-dessous pour être corrigés dans la documentation backend.

## Socle commun (fait)

Le client API ajoute le jeton et rafraîchit la session sur 401 (`src/lib/apiClient.ts`). Les erreurs sont normalisées (`apiErrors.ts`). Les droits par rôle sont disponibles via `useCan(ressource, action)` (`permissions.ts`, `currentUser.ts`). Les formatteurs sont dans `formatters.ts`. Détails : [ARCHITECTURE.md](ARCHITECTURE.md).

**Aucun écran n'utilise encore `useCan`** : tous les boutons sont visibles pour tous les rôles. C'est le premier point de chaque écran dans la suite.

## Écarts entre le guide et le code backend

| Sujet | Le guide dit | Le code fait (`apps/core/permissions.py`) | Le frontend suit |
|---|---|---|---|
| Environnement (§ 3 et § 6.3) | « les trois rôles lisent, saisissent et modifient ; seul l'Administrateur supprime une mesure » | lecture : tous ; saisie : A, D, E ; modification et suppression : A, D | le code |
| Rôles | muet | création, modification, suppression : Administrateur seul ; lecture : tous | le code |
| Comptes : liste et détail | A, D, G | A, D, G (concorde) ; écriture : A, G | le code |
| `/api/auth/me/` (§ 1) | `role` cité comme libellé | `role` est un objet `{id, libelle, …}`, plus `role_id` et `must_change_password` | le code |
| Durée des jetons (§ 6.8) | accès 15 j > refresh 7 j, « à corriger » | toujours 15 j / 7 j (`config/settings.py`) | à signaler au backend |
| Sortie de stock | sortie et création du lot via `grossissement/lots-grossissement/apercu-sortie/` et `POST lots-grossissement/` (§ 4.7) | `effectifs/sorties-stock/` est en lecture seule, plus l'action `annuler` | le code : le frontend doit migrer (voir Stock) |

## Écrans

Statuts : **fait** (branché et conforme), **partiel** (branché, mais des écarts à corriger), **à faire** (maquette ou non branché), **hors périmètre** (pas d'API backend).

Deux écarts concernent **tous** les écrans de production : aucun bouton n'est conditionné par le rôle (`useCan`), et les gardes « session expirée » dans les pages sont devenus redondants avec le client.

| Route | Écran | Endpoints appelés | Statut | Écarts à corriger (section du guide) |
|---|---|---|---|---|
| `/login` | Connexion | `auth/login/`, `auth/me/` | fait | Redirection : seul l'Administrateur va vers `/admin` ; la Gestionnaire (qui gère les comptes) va vers `/production` (§ 3). |
| `/change-password` | Mot de passe | `users/change-password/` | fait | — |
| `/admin` | Accueil administration | aucun (données `src/lib/data.ts`) | à faire | Maquette. La navigation pointe vers `/admin/stock` et `/admin/alerts`, routes inexistantes. |
| `/admin/users`, `/admin/users/new` | Comptes | `users/`, `roles` | partiel | Écriture réservée à A et G ; seul A attribue le rôle Administrateur ou modifie un compte Administrateur (§ 3). Vérifier la désactivation et la réinitialisation contre `54ffab2`. |
| `/admin/orders`, `/admin/orders/[reference]` | Commandes | aucun (`src/lib/data.ts`) | hors périmètre | Pas d'API. |
| `/dashboard` | Indicateurs | aucun | à faire | Maquette. |
| `/production` | Accueil production | aucun (`src/lib/data.ts`) | à faire | Maquette. |
| `/production/reproduction` | Reproductions et pontes | `bassins/`, `reproduction/reproductions/`, `reproduction/pontes/` | partiel | Création et désactivation : A, D seulement (§ 3). |
| `/production/ecloserie`, `/nouveau` | Éclosions | `bassins/`, `reproduction/*`, `ecloserie/`, `lots/` | partiel | Création : A, D (§ 3). |
| `/production/lots`, `/new`, `/[lotId]`, `/[lotId]/modifier` | Lots | `lots/`, `effectifs/`, `ecloserie/` | partiel | **Bouton « Clôturer » à retirer** : `PATCH lots/{id}/cloturer/` répond 404 (§ 4.1, § 6.1). Le bouton « Supprimer » (`DELETE lots/{id}/`) reste réservé à A et D. L'effectif est recalculé côté client (`computeLotEffectif`) : utiliser `effectifs/solde/` (§ 4.4). Le stade s'affiche, mais ne se saisit pas. |
| `/production/traitement`, `/nouveau` | Traitements | `traitement/`, `lots/`, `bassins/`, `provende/`, `provende/types/` | partiel | Ouverture : A, D (§ 4.2). |
| `/production/traitement/[traitementId]` | Fiche traitement | `traitement/{id}/`, mortalités, provende | partiel | **La clôture n'appelle pas l'API** (simple état local). À brancher : `apercu-cloture/` (avec `date_cloture`), `cloturer/`, puis le dialogue « Mettre en stock maintenant ? » (§ 4.2). |
| `/production/stock`, `/nouveau` | Mises en stock | `stocks/`, `lots/`, `bassins/`, `traitement/` | partiel | Création : A, D. Date minimale = date de clôture du traitement ; justification si écart (§ 4.3). Pas de modification ni de suppression (§ 6.4, § 6.5). |
| `/production/stock/[lotStockageId]` | Fiche stock | `stocks/`, `effectifs/sorties-stock/` | partiel | **Le formulaire de sortie appelle des routes qui n'existent plus** (`POST` et `PATCH sorties-stock/`, `sorties-stock/{id}/apercu/`) : à remplacer par l'écran de sortie du grossissement (§ 4.7). **La section « Clôture du stock » est locale et ne doit pas exister** : un stock ne se vide que par la sortie vers le grossissement (§ 4.3). L'annulation d'une sortie (`sorties-stock/{id}/annuler/`) reste valable (A, D). |
| `/production/grossissement` | Lots de grossissement | `grossissement/lots-grossissement/` | partiel | Liste seulement ; filtres `statut`, `espece`, `bassin`, `date_min`, `date_max` à brancher (§ 4.7). |
| `/production/grossissement/nouveau` | Sortie vers le grossissement | aucun (page vide) | à faire | Écran en trois blocs avec `apercu-sortie/`, puis `POST lots-grossissement/`, et confirmation d'échantillon non conforme (§ 4.7). |
| `/production/grossissement/[grossissementId]` | Fiche lot de grossissement | `lots-grossissement/{id}/` | partiel | À ajouter : pesées (aperçu, création, correction, annulation), `origine/`, clôture (`apercu-cloture/`, `cloturer/`), évacuation, `PATCH` observation (§ 4.7). |
| `/production/grossissement/suivi` | Suivi de cycle | à vérifier | à faire | Contrat `lots-grossissement/{id}/suivi/` (`CONTEXTE_PHASE4_PAGE_SUIVI.md`). |
| `/production/grossissement/historique` | Historique des clôtures | à vérifier | à faire | `lots-grossissement/historique-clotures/` (§ 4.7). |
| `/bassins`, `/new`, `/[bassinId]` | Bassins et hapas | `bassins/` | partiel | Écriture : A, D (§ 3). |
| `/environnement/new` et sections environnement | Mesures | `environnement/`, `environnement/latest/`, `bassins/` | partiel | Saisie : A, D, E ; modification et suppression : A, D (voir les écarts). La route `environnement/latest/` existe (action `dernieres_mesures`). |
| `/provende`, `/provende/new` | Stock de provendes | aucun (`/new` vide) | hors périmètre | Pas d'API de stock de provendes ; les référentiels `provende/` et `provende/types/` sont utilisés ailleurs. |
| Journaux (dans les fiches) | Mortalités, pertes, provende | `effectifs/evenements-mortalite-perte/`, `causes-mortalite/`, `categories-perte/`, `provende/consommations-provende/` | partiel | Saisie : A, D, E ; annulation : A, D (§ 4.5, § 4.6). Afficher les refus (hapa bloqué, lot clôturé, effectif insuffisant). |

## Données locales à retirer

- `src/app/features/production/shared/data/localProductionRecords.ts` : enregistrements gardés dans le navigateur.
- `src/lib/data.ts` : maquettes. Elles sont utilisées par `BassinSelector`, `LotSelector`, `/admin`, `/admin/orders` et `/production`.
