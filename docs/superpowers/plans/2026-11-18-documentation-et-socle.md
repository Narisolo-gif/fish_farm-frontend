# Documentation et socle commun : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** remettre la documentation du frontend en accord avec le code et le backend du 2026-11-17, puis poser un socle commun testé : session et jeton, client API, erreurs, droits par rôle, formatteurs.

**Architecture :** les règles d'API restent dans le guide backend ; le frontend documente sa structure, l'état de l'intégration par écran et la recette. Le socle vit dans `src/lib/` :
- `session.ts` : jetons ;
- `apiClient.ts` : requêtes, jeton automatique, refresh sur 401 ;
- `apiErrors.ts` : normalisation des erreurs ;
- `permissions.ts` : copie de `MATRICE` ;
- `currentUser.ts` : `/api/auth/me/` et `useCan` ;
- `formatters.ts` : utilitaires de format.

Les pages et services existants cessent de lire le jeton eux-mêmes.

**Pile technique :** Next.js 16.3.4, React 19.3.0, TypeScript 6.0.3, Vitest 3.2.4 (environnement `node`).

**Spec :** `docs/superpowers/specs/2026-11-18-integration-frontend-design.md`

**Hors de ce plan :** la partie 3 de la spec (intégration écran par écran). Elle aura son propre plan, rédigé à partir du tableau `docs/INTEGRATION.md` produit ici.

## Contraintes globales

- Documentation en français. Le guide backend `../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md` reste l'unique source des règles d'API : renvoyer vers lui, ne pas recopier ses sections.
- Ordre de priorité en cas d'écart : code backend et ses tests > `REGLES_DE_GESTION_FISH_FARM.md` > guide. Signaler les écarts dans `docs/INTEGRATION.md`, sans corriger le backend.
- Ne pas modifier `AGENTS.md` ni `CLAUDE.md`.
- Rôles (libellés exacts) : `Administrateur`, `Directeur`, `Gestionnaire`, `Employé`.
- `/api/auth/me/` renvoie `role` sous forme d'objet `{id, libelle, …}` et `must_change_password`.
- Clés de stockage existantes, à conserver : `localStorage` `access_token` et `refresh_token`.
- Refresh : `POST /api/auth/refresh/` `{refresh}` → `{access, refresh}` (rotation : l'ancien refresh est révoqué).
- Rien de neuf à afficher dans ce plan : aucun changement visuel.
- Commandes de vérification : `npm run lint`, `npm run typecheck`, `npm run test`.

## Points de vigilance pour la relecture

1. **Plusieurs 401 simultanés** (une page lance 3 requêtes avec un jeton expiré) : un seul appel au refresh, puis les 3 requêtes rejouées. Sinon la rotation révoque le refresh et l'utilisateur est déconnecté. Test dans la tâche 4.
2. **Échec du refresh** : session vidée, puis redirection vers `/login`, sans boucle de refresh. Test dans la tâche 4.
3. **Réponse 204 ou corps non JSON** (`evacuer`, `logout`) : `apiRequest` renvoie `null` sans planter. Test dans la tâche 4.
4. **403 sans `detail`** : message lisible « Vous n'avez pas les droits nécessaires pour cette action. ». Test dans la tâche 3.
5. **Rôle inconnu, `null` ou compte sans rôle** : `can()` renvoie `false` partout. Test dans la tâche 2.

---

### Tâche 1 : documentation de structure (README, ARCHITECTURE, archives)

**Fichiers :**
- Modifier : `README.md` (réécriture complète), `README_DOCKER.md` (supprimer la phrase « avec des données mockées »)
- Créer : `docs/ARCHITECTURE.md`
- Déplacer : `architecture_module_production.md` → `docs/archives/architecture_module_production.md`
- Supprimer : les dossiers vides `src/app/features/production/grossissement/` (tout le code est dans `grossissements/`)

**Interfaces :** aucune.

- [ ] **Étape 1 : archiver l'ancien document**

`git mv architecture_module_production.md docs/archives/`, puis ajouter en première ligne :
`> **Obsolète (2026-11-18)** : arborescence et MCD de septembre, remplacés par [ARCHITECTURE.md](../ARCHITECTURE.md). Conservé pour l'historique.`

- [ ] **Étape 2 : supprimer les dossiers vides de `grossissement`**

Run : `find src/app/features/production/grossissement -type f | wc -l` → `0`, puis `rm -r src/app/features/production/grossissement`.

- [ ] **Étape 3 : écrire `docs/ARCHITECTURE.md`** (≈ 1 à 2 pages)

Sections :
1. Routes : arbre réel de `src/app/` (`login`, `change-password`, `admin/{users,orders}`, `production/{reproduction,ecloserie,lots,traitement,stock,grossissement}`, `bassins`, `environnement`, `provende`, `dashboard`), une ligne de rôle par route.
2. Domaines : `src/app/features/production/<domaine>/{components,hooks,services,types}` et `shared/` (bassins, environnement, lot, ponte, mortalite-ui, provende-ui, dashboard-ui, plan-ui).
3. Socle `src/lib/` : les six fichiers de l'architecture ci-dessus, un rôle chacun.
4. Conventions :
   - tout appel réseau passe par `apiRequest` ;
   - un service par domaine ;
   - aucune lecture de `localStorage` hors de `session.ts` ;
   - les boutons d'action sont conditionnés par `useCan` ;
   - afficher les valeurs calculées par le backend, ne pas les recalculer.
5. Dette connue : `shared/data/localProductionRecords.ts` (données locales à retirer pendant la partie 3), `src/lib/data.ts` (maquettes).

- [ ] **Étape 4 : réécrire `README.md`**

Contenu :
- présentation en deux lignes ;
- prérequis : Node ≥ 20.9.0 et backend lancé (renvoi vers le README backend) ;
- `.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:8000` ;
- scripts `dev`, `build`, `start`, `lint`, `typecheck` et `test` (la ligne `test` est ajoutée par la tâche 2) ;
- Docker : renvoi vers `README_DOCKER.md` ;
- liens vers `docs/ARCHITECTURE.md`, `docs/INTEGRATION.md`, `docs/RECETTE.md` et le guide backend.

Supprimer la liste de routes périmée (`/orders`, `/users`, `/basins/new`, `/production/[module]`) et la phrase « backend… laissés pour les prochaines étapes ».

- [ ] **Étape 5 : vérifier**

Run : `npm run typecheck && npm run lint` → aucune erreur (le déplacement du dossier vide ne casse rien).
Contrôler à la main que chaque lien relatif des trois documents ouvre un fichier existant.

- [ ] **Étape 6 : commit**

```bash
git add -A README.md README_DOCKER.md docs/ARCHITECTURE.md docs/archives architecture_module_production.md
git commit -m "docs: réécrire README, ajouter ARCHITECTURE et archiver l'ancienne architecture"
```

### Tâche 2 : outillage de test et matrice des droits

**Fichiers :**
- Modifier : `package.json` (devDependency `vitest@3.2.4`, script `"test": "vitest run"`)
- Créer : `vitest.config.ts`, `src/lib/permissions.ts`, `src/lib/permissions.test.ts`

**Interfaces :**
- Produit :
  - `type Role = "Administrateur" | "Directeur" | "Gestionnaire" | "Employé"`
  - `type Ressource` (les 26 clés de `MATRICE` backend, mêmes noms : `"roles"`, `"utilisateurs"`, `"bassins"`, …, `"lots_grossissement"`, `"pesees"`)
  - `const MATRICE: Record<Ressource, Record<string, readonly Role[]>>`
  - `function can(role: string | null | undefined, ressource: Ressource, action: string): boolean`

- [ ] **Étape 1 : installer Vitest et configurer**

Run : `npm install -D vitest@3.2.4`. Dans `vitest.config.ts` : `environment: "node"`, `include: ["src/**/*.test.ts"]`, alias `@` → `./src`.

- [ ] **Étape 2 : écrire le test qui échoue** (`src/lib/permissions.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("can", () => {
  it.each([
    ["Directeur", "traitement", "cloturer", true],
    ["Gestionnaire", "traitement", "cloturer", false],
    ["Employé", "traitement", "apercu_cloture", true],
    ["Employé", "evenements_mortalite_perte", "create", true],
    ["Gestionnaire", "evenements_mortalite_perte", "create", false],
    ["Employé", "evenements_mortalite_perte", "annuler", false],
    ["Gestionnaire", "utilisateurs", "create", true],
    ["Directeur", "utilisateurs", "create", false],
    ["Employé", "utilisateurs", "list", false],
    ["Directeur", "stocks", "destroy", false],
    ["Administrateur", "stocks", "destroy", true],
    ["Gestionnaire", "environnement", "create", false],
    ["Directeur", "environnement", "destroy", true],
    ["Employé", "pesees", "apercu", true],
    ["Employé", "pesees", "partial_update", false],
    ["Directeur", "lots_grossissement", "evacuer", true],
    ["Gestionnaire", "roles", "list", true],
    ["Directeur", "roles", "create", false],
  ] as const)("%s / %s.%s → %s", (role, ressource, action, attendu) => {
    expect(can(role, ressource, action)).toBe(attendu);
  });

  it("refuse une action absente de la matrice", () => {
    expect(can("Administrateur", "lots", "cloturer")).toBe(false);
  });

  it.each([null, undefined, "", "Stagiaire"])("refuse le rôle %s partout", (role) => {
    expect(can(role, "bassins", "list")).toBe(false);
  });
});
```

- [ ] **Étape 3 : lancer le test pour vérifier l'échec**

Run : `npm run test` → FAIL (`./permissions` introuvable).

- [ ] **Étape 4 : écrire `src/lib/permissions.ts`**

Recopier `MATRICE` de `../fish_farm-backend/apps/core/permissions.py` clé par clé, avec les mêmes noms d'action DRF. Utiliser des constantes `TOUS`, `PILOTAGE` (A, D), `TERRAIN` (A, D, E), `COMPTES` (A, G), `ADMIN_SEUL` et des objets `LECTURE` / `CRUD_PILOTAGE`, comme dans le backend. Ajouter en commentaire d'en-tête : « copie de MATRICE backend au commit 54ffab2 ; à resynchroniser si le backend change ». `can` renvoie `false` pour un rôle hors des quatre libellés.

- [ ] **Étape 5 : lancer les tests**

Run : `npm run test` → PASS. Puis `npm run typecheck && npm run lint` → OK.

- [ ] **Étape 6 : commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/permissions.ts src/lib/permissions.test.ts
git commit -m "feat(socle): matrice des droits côté interface et outillage Vitest"
```

### Tâche 3 : normalisation des erreurs d'API

**Fichiers :**
- Créer : `src/lib/apiErrors.ts`, `src/lib/apiErrors.test.ts`
- Modifier : `src/lib/apiClient.ts` (retirer `getErrorMessage`, `extractFieldErrors` et `getGeneralErrorMessage`, puis importer depuis `apiErrors.ts` ; `ApiError` et `ApiFieldErrors` restent exportés depuis `apiClient.ts` par réexport, pour ne casser aucun import existant)

**Interfaces :**
- Produit :
  - `class ApiError extends Error { status: number; fieldErrors: ApiFieldErrors; generalMessage: string }` (forme inchangée)
  - `type ApiFieldErrors = Record<string, string[]>`
  - `function toApiError(status: number, data: unknown): ApiError`
  - `const MESSAGE_403 = "Vous n'avez pas les droits nécessaires pour cette action."`
  - `const MESSAGE_GENERIQUE = "Une erreur est survenue."`

- [ ] **Étape 1 : écrire les tests qui échouent**

Tests à écrire, avec leurs assertions :
- `{"date_cloture": "La date ne peut pas être future."}` donne `fieldErrors` égal à `{date_cloture: ["La date ne peut pas être future."]}`, et `message` contient `date_cloture: La date…` ;
- `{"quantite": ["a", "b"]}` donne `fieldErrors.quantite` égal à `["a", "b"]` ;
- `{"detail": "Lot clôturé."}` donne `generalMessage` égal à `"Lot clôturé."` et des `fieldErrors` vides ;
- `{"non_field_errors": ["x", "y"]}` donne `generalMessage` égal à `"x y"` ;
- `{"echantillon_non_conforme": "msg", "lignes_non_conformes": [{…}]}` garde `fieldErrors.echantillon_non_conforme` égal à `["msg"]`, ignore les éléments non textuels, et `data` brut est accessible via `apiError.data` (ajouter le champ `data: unknown` à `ApiError`) ;
- 403 avec un corps `null` donne `message` et `generalMessage` égaux à `MESSAGE_403` ;
- 500 avec un corps `null` donne `message` égal à `MESSAGE_GENERIQUE`.

- [ ] **Étape 2 : lancer les tests pour vérifier l'échec**

Run : `npm run test -- apiErrors` → FAIL.

- [ ] **Étape 3 : écrire `apiErrors.ts`**

Y déplacer les trois fonctions existantes de `apiClient.ts` et `ApiError` (avec le nouveau champ `data`), puis ajouter `toApiError`. Dans `apiRequest`, remplacer la construction actuelle par `throw toApiError(response.status, data)`.

- [ ] **Étape 4 : lancer tous les tests et le typage**

Run : `npm run test && npm run typecheck` → PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/lib/apiErrors.ts src/lib/apiErrors.test.ts src/lib/apiClient.ts
git commit -m "feat(socle): normaliser les erreurs d'API (400, 403, corps vide)"
```

### Tâche 4 : session et client API authentifié

**Fichiers :**
- Créer : `src/lib/session.ts`, `src/lib/apiClient.test.ts`
- Modifier : `src/lib/apiClient.ts`

**Interfaces :**
- Consomme : `toApiError` (tâche 3).
- Produit :
  - `session.ts` : `getAccessToken(): string | null`, `getRefreshToken(): string | null`, `setTokens(access: string, refresh: string): void`, `clearSession(): void`. Ce sont les seuls accès à `localStorage` pour les jetons (clés `access_token` et `refresh_token`), avec un garde `typeof window === "undefined"` qui renvoie `null` ou ne fait rien.
  - `apiClient.ts` : `apiRequest<T>(endpoint: string, options?: RequestInit & { auth?: boolean }): Promise<T>`. Par défaut `auth: true` : ajoute `Authorization: Bearer <access>` s'il existe, sans écraser un en-tête `Authorization` fourni par l'appelant. Sur 401 avec `auth`, un seul refresh partagé (promesse unique en cours), puis un seul rejeu. Si le refresh échoue : `clearSession()`, `window.location.assign("/login")` côté navigateur, puis `ApiError` 401. Une réponse 204 ou un corps non JSON renvoie `null`.
  - `logout(): Promise<void>` : `POST /api/auth/logout/ {refresh}` (erreurs ignorées), puis `clearSession()`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`apiClient.test.ts`, `fetch` et `localStorage` simulés avec `vi.stubGlobal`)

Tests à écrire, avec leurs assertions :
- avec `access_token="A"` : l'en-tête envoyé est `Authorization: Bearer A` ;
- `auth: false` : aucun en-tête `Authorization` ;
- un 401 suivi d'un refresh 200 `{access:"A2", refresh:"R2"}` : la requête est rejouée avec `Bearer A2`, et `localStorage` contient `A2` et `R2` ;
- trois requêtes en parallèle reçoivent 401 : `fetch` est appelé une seule fois sur `/api/auth/refresh/`, et les trois promesses se résolvent ;
- le refresh répond 401 : `clearSession` est appelé (clés supprimées), une `ApiError` de statut 401 est levée, et aucun second refresh n'a lieu ;
- le rejeu reçoit encore 401 : erreur levée, pas de nouveau refresh ;
- une réponse 204 renvoie `null` ;
- `/api/auth/login/` et `/api/auth/refresh/` ne déclenchent jamais de refresh.

- [ ] **Étape 2 : lancer les tests pour vérifier l'échec**

Run : `npm run test -- apiClient` → FAIL.

- [ ] **Étape 3 : écrire `session.ts` et étendre `apiRequest`**

- [ ] **Étape 4 : brancher la connexion**

Dans `src/app/login/page.tsx`, appeler `apiRequest(..., { auth: false })` pour le login, puis `setTokens(data.access, data.refresh)`, puis `apiRequest("/api/auth/me/")` sans en-tête manuel. Remplacer l'appel de déconnexion existant (trouvé par `grep -rn "auth/logout" src`) par `logout()`.

- [ ] **Étape 5 : lancer les tests**

Run : `npm run test && npm run typecheck && npm run lint` → PASS.

- [ ] **Étape 6 : commit**

```bash
git add src/lib/session.ts src/lib/apiClient.ts src/lib/apiClient.test.ts src/app/login/page.tsx
git commit -m "feat(socle): jeton automatique et refresh unique sur 401"
```

### Tâche 5 : migrer les appels existants vers le client authentifié

**Fichiers :**
- Modifier : les fichiers listés par `grep -rln 'localStorage.getItem("access_token")' src`, sauf `session.ts`. Exemples : `src/app/features/production/lots/services/lotApi.ts`, `src/app/features/production/stocks/services/stockApi.ts`, `src/app/features/production/traitement/components/TraitementForm.tsx`, `src/app/admin/users/page.tsx`, `src/components/AppShell.tsx`.

**Interfaces :**
- Consomme : `apiRequest` avec `auth` par défaut (tâche 4).

- [ ] **Étape 1 : relever l'état de départ**

Run : `grep -rn 'getItem("access_token")\|getAuthHeaders\|Authorization: `Bearer' src | wc -l` → noter le nombre (≈ 30).

- [ ] **Étape 2 : migrer chaque fichier**

Supprimer les fonctions `getAuthHeaders` locales, la lecture du jeton et l'en-tête `Authorization` passé à la main. Le message « Votre session a expiré » est désormais pris en charge par le client (redirection). Ne changer aucun autre comportement de la page.

- [ ] **Étape 3 : vérifier**

Run : `grep -rn 'access_token' src` → seulement `src/lib/session.ts` (et son test).
Run : `grep -rn 'fetch(' src` → seulement `src/lib/apiClient.ts`.
Run : `npm run typecheck && npm run lint && npm run test` → OK.
Contrôle manuel, backend lancé : se connecter, ouvrir `/production/lots` et `/production/traitement`, puis vérifier que les listes se chargent.

- [ ] **Étape 4 : commit**

```bash
git add -A src
git commit -m "refactor(socle): tous les appels passent par le client authentifié"
```

### Tâche 6 : utilisateur courant et `useCan`

**Fichiers :**
- Créer : `src/lib/currentUser.ts`
- Modifier : `src/components/AppShell.tsx` (utiliser `useCurrentUser` au lieu de son appel `me` local)

**Interfaces :**
- Consomme : `apiRequest`, `can`, `Ressource`.
- Produit :
  - `type CurrentUser = { id: number; username: string; first_name: string; last_name: string; email: string; role: { id: number; libelle: string } | null; statut: string; must_change_password: boolean }`
  - `function fetchCurrentUser(): Promise<CurrentUser>` : un seul appel `GET /api/auth/me/` partagé entre composants (promesse mise en cache dans le module), remise à zéro par `clearSession()`.
  - `function useCurrentUser(): { user: CurrentUser | null; loading: boolean }`
  - `function useCan(ressource: Ressource, action: string): boolean` : `false` tant que l'utilisateur n'est pas chargé.

- [ ] **Étape 1 : écrire le test qui échoue** (`src/lib/currentUser.test.ts`, `fetch` simulé)

- deux appels successifs à `fetchCurrentUser()` ne déclenchent qu'un seul `fetch` ;
- après `clearSession()`, un nouvel appel relance `fetch`.

- [ ] **Étape 2 : lancer le test pour vérifier l'échec**

Run : `npm run test -- currentUser` → FAIL.

- [ ] **Étape 3 : écrire `currentUser.ts`, puis brancher `AppShell`**

Pour que `clearSession()` puisse remettre le cache à zéro sans créer d'import circulaire : `session.ts` expose `onSessionCleared(cb: () => void): void` et `currentUser.ts` s'y abonne.

- [ ] **Étape 4 : vérifier**

Run : `npm run test && npm run typecheck && npm run lint` → PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/lib/currentUser.ts src/lib/currentUser.test.ts src/lib/session.ts src/components/AppShell.tsx
git commit -m "feat(socle): utilisateur courant partagé et useCan"
```

### Tâche 7 : formatteurs

**Fichiers :**
- Modifier : `src/lib/formatters.ts` (vide aujourd'hui)
- Créer : `src/lib/formatters.test.ts`

**Interfaces :**
- Produit :
  - `parseDecimal(value: string | number | null | undefined): number | null`
  - `formatDecimal(value: string | number | null | undefined, digits?: number): string` : format `fr-FR`, `"—"` si `null`
  - `todayIso(now?: Date): string` : `AAAA-MM-JJ` dans le fuseau `Indian/Antananarivo`
  - `listResults<T>(data: T[] | { results: T[] }): T[]`

- [ ] **Étape 1 : écrire les tests qui échouent**

- `parseDecimal("20.00")` vaut `20` ;
- `parseDecimal("")`, `parseDecimal(null)` et `parseDecimal("abc")` valent `null` ;
- `parseDecimal(3.5)` vaut `3.5` ;
- `formatDecimal("1234.5", 2)` vaut `"1 234,50"` (espace insécable fine de `fr-FR` : comparer après `.replace(/\s/g, " ")`) ;
- `formatDecimal(null)` vaut `"—"` ;
- `todayIso(new Date("2026-11-17T22:30:00Z"))` vaut `"2026-11-18"` (UTC+3) ;
- `listResults([1])` vaut `[1]` et `listResults({results:[2]})` vaut `[2]`.

- [ ] **Étape 2 : lancer les tests pour vérifier l'échec**

Run : `npm run test -- formatters` → FAIL.

- [ ] **Étape 3 : écrire les fonctions**

`todayIso` utilise `Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Antananarivo" })`.

- [ ] **Étape 4 : remplacer les doublons**

Remplacer les `getResults` locaux (par exemple dans `lotApi.ts`, trouvés par `grep -rn "function getResults" src`) par `listResults`.

- [ ] **Étape 5 : vérifier**

Run : `npm run test && npm run typecheck && npm run lint` → PASS.

- [ ] **Étape 6 : commit**

```bash
git add src/lib/formatters.ts src/lib/formatters.test.ts src/app
git commit -m "feat(socle): formatteurs (décimaux, dates, listes)"
```

### Tâche 8 : état de l'intégration et recette

**Fichiers :**
- Créer : `docs/INTEGRATION.md`, `docs/RECETTE.md`

**Interfaces :** aucune. Ce document est l'entrée du plan de la partie 3.

- [ ] **Étape 1 : écrire l'en-tête de `INTEGRATION.md`**

Lien vers le guide backend, ordre de priorité, date et commit backend de référence (`54ffab2`, branche `release/1.0.0`).

- [ ] **Étape 2 : écrire la section « Écarts guide ↔ code backend »**

Pour chaque écart : ce que dit le guide, ce que fait le code, la source suivie par le frontend (toujours le code). Écarts déjà relevés :
- Environnement : le guide (§ 6.3) dit que « les trois rôles lisent, saisissent et modifient ; seul l'Administrateur supprime ». Le code donne la saisie à A, D et E, et la modification comme la suppression à A et D.
- Rôles : la création et la modification sont réservées à l'Administrateur ; le guide est muet.
- `/api/auth/me/` : `role` est un objet `{id, libelle}`, et non un libellé.
- Jeton d'accès valable 15 jours, refresh 7 jours (bug backend connu, à signaler).

Compléter en relisant `GUIDE_INTEGRATION_FRONTEND.md` § 3 ligne par ligne contre `src/lib/permissions.ts`.

- [ ] **Étape 3 : remplir le tableau de l'état d'intégration**

Une ligne par route de `src/app/**/page.tsx` (23 routes), avec les colonnes : route | écran | endpoints appelés (lus dans le service ou la page) | statut `fait` / `partiel` / `à faire` / `hors périmètre` | écarts à corriger, en citant la section du guide.

Pour chaque ligne, vérifier au minimum :
- données mockées (`src/lib/data.ts`, `localProductionRecords`) ;
- boutons non conditionnés par le rôle ;
- actions interdites exposées (clôture directe d'un lot, modification ou suppression d'une mise en stock, `DELETE` traitement ou stock) ;
- appels d'aperçu absents ;
- erreurs non affichées par champ.

`/admin/orders` et `/provende` (stock de provendes) sont « hors périmètre » s'il n'existe pas d'API correspondante.

- [ ] **Étape 4 : écrire `RECETTE.md`**

1. Préparation : backend lancé, `python manage.py seed_grossissement`, un compte par rôle (indiquer comment le créer, à confirmer dans le README backend).
2. Modèle de checklist par écran, un tableau par rôle :

| Rôle | Visible | Masqué | Parcours nominal | Refus attendus |
|---|---|---|---|---|

3. Exemple rempli pour l'écran « Traitement : clôture », tiré du guide § 4.2 : date future refusée, `raison_refus` affichée, enchaînement vers la mise en stock, l'Employé ne voit pas « Clôturer ».
4. Section « À automatiser plus tard (Playwright) » : un parcours par rôle, sur la base `seed_grossissement`. Rien n'est installé dans ce projet.

- [ ] **Étape 5 : vérifier**

Chaque route de `find src/app -name page.tsx` a une ligne. Chaque lien relatif ouvre un fichier existant.

- [ ] **Étape 6 : commit**

```bash
git add docs/INTEGRATION.md docs/RECETTE.md
git commit -m "docs: état de l'intégration par écran et modèle de recette"
```

---

## Vérification finale

- `npm run lint && npm run typecheck && npm run test && npm run build` → OK.
- `grep -rn 'access_token' src` → seulement `session.ts` et son test.
- Backend lancé : se connecter avec un compte Directeur puis un compte Employé, parcourir lots, traitement et stock. Aucune régression, et une déconnexion forcée (suppression de `refresh_token` dans les DevTools, puis expiration de l'accès) renvoie bien vers `/login`.
- Suite : rédiger le plan de la partie 3 à partir de `docs/INTEGRATION.md`.
