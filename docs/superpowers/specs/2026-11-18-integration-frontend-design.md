# Préparation de l'intégration frontend ↔ backend (Fish Farm)

## Contexte

Le backend (`../fish_farm-backend`, branche `release/1.0.0`) a changé de règles le 2026-11-17 :
- nouvelle matrice des droits : le Directeur porte la production, la Gestionnaire gère les comptes, l'Employé fait la saisie de terrain ;
- `PATCH lots/{id}/cloturer/` répond 404 ;
- une mise en stock ne se modifie ni ne se supprime ;
- `/environnement/` exige un jeton ;
- grossissement complet : sortie, pesée, clôture, évacuation, suivi.

Le commit `54ffab2` (refonte de l'administration) est postérieur à la dernière mise à jour de la documentation backend.

Côté frontend (`release/integration-1.0.0`), la documentation est périmée :
- `README.md` annonce encore des données mockées ;
- `architecture_module_production.md` décrit une arborescence `app/production/...` et un MCD (trois tables de mortalité, `VENTE_LOT`) qui ne correspondent plus au code.

Le code, lui, appelle déjà une partie de l'API, mais sans socle commun :
- jeton lu dans `localStorage` page par page ;
- aucun contrôle de rôle dans l'interface ;
- deux dossiers `grossissement` / `grossissements` ;
- aucun outil de test (seulement `lint` et `typecheck`).

**But** : partir d'une documentation à jour et d'un plan clair pour brancher tous les écrans sur l'API réelle, puis les tester. D'abord des tests unitaires et des checklists manuelles, ensuite des tests automatisés de bout en bout (E2E).

## Décisions prises avec l'utilisateur

- **Documentation** : réécriture, avec renvoi vers le guide backend. Le guide `fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md` reste l'unique source des règles d'API. Le frontend ne le recopie pas.
- **Tests** : tests unitaires et checklists manuelles par écran et par rôle dans ce projet. Les tests E2E automatisés viendront dans une phase ultérieure, seulement préparée ici.
- **Langue** : documentation en français, comme le backend.

## Objectifs / non-objectifs

- Objectifs : une documentation fidèle au code ; un socle commun (client API, erreurs, droits) testé ; chaque écran de production branché sur la vraie API et conforme à la matrice des droits ; une checklist de recette par écran.
- Non-objectifs : refonte visuelle ; nouvelles fonctionnalités absentes du backend (vente de stock, clôture directe de lot) ; corrections côté backend (on les signale dans la documentation).
- Anti-objectifs : recopier les règles backend dans le frontend ; afficher une action que le rôle ne peut pas faire ; recalculer côté client des valeurs que le backend fournit (afficher, ne pas recalculer).

## Partie 1 — Documentation (en premier)

1. **Vérifier le guide backend contre `54ffab2`**. Comparer `MATRICE` dans `apps/core/permissions.py` et `apps/core/roles.py` avec la section 3 du guide. Noter les écarts dans `docs/INTEGRATION.md`, sans corriger le backend.
2. **`README.md`** (réécriture) : prérequis, `npm install` / `npm run dev`, variable d'URL de l'API, scripts (`dev`, `build`, `lint`, `typecheck`, puis `test`), lancement avec Docker (renvoi vers `README_DOCKER.md`, à vérifier), routes réelles d'après `src/app/`, liens vers les autres documents.
3. **`docs/ARCHITECTURE.md`** (nouveau, court) : l'arborescence réelle (`src/app/<routes>`, `src/app/features/production/<domaine>/{components,hooks,services,types}`, `shared/`, `src/lib/apiClient.ts`, `src/components/`), les conventions (un service par domaine, appels uniquement via `apiClient`) et les doublons à résorber (`grossissement` / `grossissements`).
4. **Archiver `architecture_module_production.md`** dans `docs/archives/`, avec une ligne en tête : « obsolète, voir ARCHITECTURE.md ».
5. **`docs/INTEGRATION.md`** (nouveau) : une ligne par écran (route frontend → endpoints backend → statut `fait` / `partiel` / `à faire` → écarts connus). Le tableau se remplit en lisant chaque service et chaque page. En tête : le lien vers le guide backend et l'ordre de priorité (code backend > `REGLES_DE_GESTION` > guide).
6. **`docs/RECETTE.md`** (nouveau) : le modèle de checklist (voir partie 3) et les données de test (`python manage.py seed_grossissement`, comptes par rôle).
7. `AGENTS.md` / `CLAUDE.md` : ne pas y toucher (fichiers générés par `next dev`).

## Partie 2 — Socle commun (avant les écrans)

- **Client API unique** (`src/lib/apiClient.ts`, à étendre) : URL de base, en-tête `Bearer`, rafraîchissement sur 401 via `POST /api/auth/refresh/` (avec rotation du refresh), déconnexion si le refresh échoue. Tous les appels directs à `fetch` / `localStorage` des pages passent par ce client.
- **Normalisation des erreurs 400** : `{champ: string | string[]}`, `detail`, `non_field_errors` → `Record<champ, string[]>` affichable. Gestion du 403 avec un message propre.
- **Droits** : `src/lib/permissions.ts` traduit la matrice du guide en actions nommées (`traitement.cloturer`, `saisie.mortalite`, etc.) avec un `can(role, action)` et un hook `useCan(action)` alimenté par `/api/auth/me/`. Le backend reste l'autorité ; l'interface se contente de masquer.
- **Utilitaires** : lecture des décimaux renvoyés en chaîne, dates `AAAA-MM-JJ`, dates-heures en `+03:00`, `data.results ?? data`. Réutiliser `src/lib/formatters.ts`.
- **Tests unitaires** : installer Vitest avec un script `npm run test`, et tester le client (401 → refresh), la normalisation des erreurs, `can()` contre toute la matrice, et les formatteurs.
- **Fusionner `grossissement` et `grossissements`** dans un seul domaine.

## Partie 3 — Intégration écran par écran

Ordre : le cycle de vie du lot, puis le reste.

1. Reproduction et pontes
2. Écloserie
3. Lots : stade en lecture seule, pas de bouton « clôturer »
4. Traitement : ouverture, suivi par hapa, aperçu de clôture, clôture, enchaînement vers la mise en stock
5. Mise en stock : date minimale, effectif de référence, justification d'écart, ni modification ni suppression
6. Registre, mortalités et pertes, provende : saisie par l'Employé et le Directeur, annulation par le Directeur, refus quand le hapa est bloqué
7. Grossissement : sortie avec aperçu, pesée, fiche et liste, suivi de cycle, clôture et évacuation, historique, annulation d'une sortie
8. Environnement : jeton obligatoire ; seul l'Administrateur supprime une mesure
9. Bassins et hapas (référentiels)
10. Administration des comptes : vérifier contre `54ffab2` ; seul l'Administrateur attribue le rôle Administrateur

Pour chaque écran :
- remplacer les données mockées par le service ;
- appliquer `useCan` ;
- utiliser les appels d'aperçu pour les boîtes de validation ;
- afficher les erreurs par champ ;
- mettre à jour sa ligne dans `INTEGRATION.md` ;
- remplir sa checklist dans `RECETTE.md`.

**Modèle de checklist** : pour chaque écran, une ligne par rôle (A / D / G / E) avec ce qui doit être visible ou masqué, les chemins nominaux, les refus attendus (400 avec message, 403) et les cas limites tirés du guide (date future, effectif dépassé, hapa bloqué, lot clôturé…).

## Partie 4 — Préparation des tests E2E (phase suivante, hors exécution)

Noter dans `RECETTE.md` les parcours à automatiser plus tard : un par rôle, sur la base `seed_grossissement`, avec Playwright. Rien n'est installé dans ce projet.

## Laissé au développeur

- Le nom exact des actions de `permissions.ts`.
- Le stockage du jeton : garder le mécanisme actuel s'il convient.
- Le découpage en commits.

## Points à confirmer pendant la réalisation

- Écarts éventuels entre le guide backend et `54ffab2` (étape 1.1).
- Durée de vie du jeton d'accès (15 j) supérieure à celle du refresh (7 j) : bug backend connu, à signaler seulement.
- Les routes `/admin/orders` et `/stock` (commandes, stock de provendes) n'ont pas d'API backend : les marquer « hors périmètre / maquette » dans `INTEGRATION.md`.

## Fichiers principaux

- Modifiés : `README.md`, `src/lib/apiClient.ts`, `src/lib/formatters.ts`, `package.json`, les services de `src/app/features/production/**/services/`, les pages concernées.
- Créés : `docs/ARCHITECTURE.md`, `docs/INTEGRATION.md`, `docs/RECETTE.md`, `src/lib/permissions.ts`, `src/lib/apiErrors.ts`, les tests `*.test.ts`.
- Déplacé : `architecture_module_production.md` → `docs/archives/`.
- Référence (lecture seule) : `../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md`, `REGLES_DE_GESTION_FISH_FARM.md`, `CONTEXTE_*.md`, `apps/core/permissions.py`.

## Vérification

- `npm run lint`, `npm run typecheck` et `npm run test` passent.
- Backend lancé avec `seed_grossissement` : dérouler `RECETTE.md` écran par écran pour les quatre rôles.
- Relecture de `INTEGRATION.md` : aucun écran sans statut, et tous les écarts sont listés.

## Étapes suivantes après approbation

1. Enregistrer ce design dans `docs/superpowers/specs/2026-11-18-integration-frontend-design.md`.
2. Rédiger le plan d'implémentation détaillé (skill `writing-plans`).
3. Commencer par la partie 1, la documentation.
