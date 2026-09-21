# Architecture du module Production — Next.js / TypeScript / Tailwind

## A. Analyse préalable (MCD + wireframe)

### Ce que le MCD révèle

En reparcourant les entités du MCD normalisé (session précédente), trois catégories de concepts se dégagent :

**1. Concepts strictement propres à un sous-domaine** — ils n'ont de sens que dans un seul contexte métier :
- `REPRODUCTION` (lot de géniteurs installé dans un hapa), `PONTE` (une reproduction peut produire plusieurs pontes) → Reproduction
- `ECLOSION` (rattachée à une `PONTE`) → Écloserie
- `TRAITEMENT`, `TRAITEMENT_HAPA`, `MORTALITE_TRAITEMENT` → Traitement
- `LOT_STOCKAGE`, `MORTALITE_STOCKAGE`, `VENTE_LOT`, `CONSOMMATION_STOCKAGE` → Stocks
- `GROSSISSEMENT`, `PARTICIPATION_GROSSISSEMENT`, `PESEE`, `MORTALITE_GROSSISSEMENT` → Grossissement

**2. Concepts transverses, réellement partagés en base** — la même table est référencée par plusieurs sous-domaines :
- `BASSIN` / `HAPA` : référencés par tous les sous-modules (`reproduction.id_hapa`, `traitement.id_bassin`, `grossissement.id_bassin`, `lot_stockage.id_bassin`, `mesure_environnementale.id_bassin`, etc.)
- `PARAMETRE_ENVIRONNEMENTAL` / `REFERENTIEL_MESURE` / `MESURE_ENVIRONNEMENTALE` : une seule table de mesures, filtrée par `id_bassin`/`id_hapa`, utilisée par les sous-domaines concernés (hors Reproduction, où seule la mesure du bassin est pertinente — la mortalité, elle, n'y est pas suivie, cf. Ambiguïtés)
- `PROVENDE` / `TYPE_PROVENDE` / `FOURNISSEUR` : référencée par `consommation_traitement`, `consommation_grossissement` **et désormais `consommation_stockage`** (ajoutée sur le même patron)
- `LOT` : pivot central. Il naît d'une `ECLOSION` (relation 1‑1, `id_eclosion` UNIQUE) — elle-même rattachée à une `PONTE`, elle-même rattachée à une `REPRODUCTION` — puis traverse `TRAITEMENT`, `LOT_STOCKAGE`, `PARTICIPATION_GROSSISSEMENT`, `VENTE_LOT`. C'est le concept le plus transverse du MCD.
- `PONTE` : transverse à un niveau plus local — créée dans Reproduction, référencée en lecture par Écloserie pour rattacher une éclosion (voir `shared/ponte/`).

**3. Concept structurellement dupliqué mais non mutualisable en base** — la mortalité :
`MORTALITE_TRAITEMENT`, `MORTALITE_STOCKAGE`, `MORTALITE_GROSSISSEMENT` ont la **même forme** (date, quantité, cause/observation, FK vers le contexte) mais sont **trois tables distinctes** rattachées à trois entités parents différentes. C'est le signal classique d'une mutualisation **au niveau UI/présentation seulement**, jamais au niveau service/données (chaque service interroge une table différente).

### Ce que le wireframe révèle

- Une **navigation de module** commune à toute la Production (`Reproduction . Écloserie . Traitement . Stock . Grossissement`) + zone profil → un layout partagé au niveau `app/production/layout.tsx`.
- Une page de sous-module = **1 zone titre/sous-titre + 3 cartes dashboard (paramètres environnementaux, indicateur métier, répartition) + 3 boutons d'action** (dont "Paramètres environnementaux" et "Configurations Bassins" qui reviennent en action dans plusieurs sous-modules probables). Cela confirme que ces deux fonctionnalités doivent être des **composants réutilisables invoqués en contexte** (modale/drawer/panel), pas des pages dédiées indépendantes.
- Le wireframe ne montre **pas** d'onglet "Lots" dans la navigation, alors que le cahier des charges liste "Lots" comme un sous-domaine à part (section III). **Ambiguïté à lever avec le client** (voir section Ambiguïtés).

### Principes retenus

1. **Séparation routage / logique métier** : `app/` ne contient que des fichiers de routing Next.js fins (`page.tsx`, `layout.tsx`) qui *assemblent* des éléments importés depuis une couche `src/features/production/**` organisée par domaine. Cela évite de mélanger convention de routing et organisation métier, et évite de dupliquer des composants dans plusieurs dossiers `app/.../_components`.
2. **Organisation par domaine métier**, pas par type technique global. Chaque sous-domaine a son propre `components/ hooks/ services/ types/` — mais uniquement les domaines qui ont un volume suffisant pour le justifier (pas de dossier vide "au cas où").
3. **Mutualisation ciblée** : uniquement les concepts identifiés au MCD comme réellement transverses (bassins/hapas, paramètres environnementaux, lot, provende) et les éléments UI génériques de mortalité/dashboard. Le reste reste local à son domaine.
4. **Pas de "god folder" `shared`** générique : le dossier transverse est scopé à `features/production/shared` (pas `src/shared` global), car ces concepts n'ont de sens que dans le module Production. Seuls les éléments *vraiment* génériques à toute l'app (bouton, table, modal Tailwind sans logique métier) vivent dans `src/components/ui`.

---

## B. Arborescence complète proposée

```
src/
├── app/
│   ├── layout.tsx                          # layout racine app (html, providers globaux)
│   ├── (auth)/                             # login / gestion utilisateurs — hors périmètre Production
│   │
│   └── production/
│       ├── layout.tsx                      # nav module (Reproduction·Écloserie·Traitement·Stock·Grossissement + profil), footer
│       │
│       ├── reproduction/
│       │   └── page.tsx                    # vue d'ensemble (dashboard + actions, cf. wireframe)
│       │
│       ├── ecloserie/
│       │   └── page.tsx
│       │
│       ├── lots/
│       │   ├── page.tsx                    # liste/recherche des lots (tous statuts/stades)
│       │   └── [lotId]/
│       │       └── page.tsx                # détail + historique transverse du lot
│       │
│       ├── traitement/
│       │   ├── page.tsx                    # liste des traitements + dashboard synthétique
│       │   ├── nouveau/
│       │   │   └── page.tsx                # ouverture d'un traitement
│       │   └── [traitementId]/
│       │       └── page.tsx                # détail : mortalité, provende, dispatch hapa, clôture
│       │
│       ├── stocks/
│       │   ├── page.tsx                    # liste des lots en stock + dashboard (taux de survie...)
│       │   └── [lotStockageId]/
│       │       └── page.tsx                # détail : mortalité, provende, sortie (vente/grossissement)
│       │
│       └── grossissement/
│           ├── page.tsx                    # liste des cycles + dashboard global
│           ├── nouveau/
│           │   └── page.tsx                # ouverture d'un cycle de grossissement
│           └── [grossissementId]/
│               └── page.tsx                # détail : pesées, mortalité, provende, dispatch bassin, clôture
│
├── features/
│   └── production/
│       │
│       ├── shared/                         # concepts transverses réels (issus du MCD)
│       │   ├── environnement/
│       │   │   ├── components/
│       │   │   │   ├── ParametresEnvironnementauxPanel.tsx   # carte dashboard (lecture)
│       │   │   │   ├── ParametresEnvironnementauxForm.tsx    # saisie d'une mesure
│       │   │   │   └── ReferentielBadge.tsx                  # pastille couleur (code_couleur)
│       │   │   ├── hooks/
│       │   │   │   ├── useMesuresEnvironnementales.ts        # param: {idBassin, idHapa?}
│       │   │   │   └── useReferentielMesure.ts
│       │   │   ├── services/
│       │   │   │   └── environnementApi.ts
│       │   │   └── types/
│       │   │       └── environnement.types.ts
│       │   │
│       │   ├── bassins/
│       │   │   ├── components/
│       │   │   │   ├── BassinConfigForm.tsx
│       │   │   │   ├── HapaConfigForm.tsx
│       │   │   │   ├── BassinSelector.tsx
│       │   │   │   ├── HapaSelector.tsx         # NOUVEAU — sélection d'un hapa unique (ex: installation des géniteurs)
│       │   │   │   ├── DispatchHapaForm.tsx     # "dispatcher les alevins/lots par hapa"
│       │   │   │   └── BassinCard.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── useBassins.ts
│       │   │   │   ├── useHapas.ts
│       │   │   │   └── useDispatchHapa.ts
│       │   │   ├── services/
│       │   │   │   └── bassinsApi.ts
│       │   │   └── types/
│       │   │       └── bassin.types.ts
│       │   │
│       │   ├── lot/
│       │   │   ├── components/
│       │   │   │   ├── LotSelector.tsx
│       │   │   │   ├── LotStatusBadge.tsx
│       │   │   │   ├── LotCard.tsx
│       │   │   │   └── LotHistoriqueTimeline.tsx  # traverse eclosion→traitement→stock→grossissement→vente
│       │   │   ├── hooks/
│       │   │   │   ├── useLot.ts
│       │   │   │   ├── useLots.ts
│       │   │   │   └── useLotHistorique.ts
│       │   │   ├── services/
│       │   │   │   └── lotApi.ts
│       │   │   └── types/
│       │   │       └── lot.types.ts
│       │   │
│       │   ├── ponte/                          # NOUVEAU — lecture/sélection uniquement (cf. §A)
│       │   │   ├── components/
│       │   │   │   └── PonteSelector.tsx        # utilisé par Écloserie pour rattacher une éclosion à une ponte
│       │   │   ├── hooks/
│       │   │   │   └── usePontes.ts             # liste des pontes (filtrable par reproduction)
│       │   │   └── types/
│       │   │       └── ponte.types.ts
│       │   │   # NB : la CRÉATION d'une ponte reste dans le domaine Reproduction
│       │   │   # (PonteForm.tsx) — seule la sélection en lecture, utilisée par un
│       │   │   # domaine tiers (Écloserie), est mutualisée ici.
│       │   │
│       │   ├── mortalite-ui/                 # UNIQUEMENT présentation (pas de service générique)
│       │   │   ├── components/
│       │   │   │   ├── MortaliteJournalTable.tsx   # props: entries[], onAdd(entry)
│       │   │   │   └── MortaliteForm.tsx
│       │   │   └── types/
│       │   │       └── mortalite.types.ts          # forme commune {date, quantite, cause?, observation?}
│       │   │
│       │   ├── provende-ui/
│       │   │   ├── components/
│       │   │   │   ├── ProvendeSelector.tsx
│       │   │   │   ├── ConsommationProvendeForm.tsx
│       │   │   │   ├── ConsommationProvendeTable.tsx
│       │   │   │   └── StockProvendeBadge.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useProvendes.ts             # catalogue provende + fournisseur (lecture, transverse)
│       │   │   ├── services/
│       │   │   │   └── provendeApi.ts              # catalogue + mouvements de stock
│       │   │   └── types/
│       │   │       └── provende.types.ts
│       │   │
│       │   └── dashboard-ui/
│       │       ├── components/
│       │       │   ├── KpiCard.tsx
│       │       │   ├── PeriodSelector.tsx
│       │       │   ├── ChartWrapper.tsx            # wrapper Recharts/Chart.js commun (thème Tailwind)
│       │       │   ├── StatsFilterBar.tsx
│       │       │   └── ExportExcelButton.tsx
│       │       └── hooks/
│       │           └── usePeriodFilter.ts
│       │
│       ├── reproduction/
│       │   ├── components/
│       │   │   ├── ReproductionForm.tsx           # NOUVEAU — installation d'un lot de géniteurs dans un hapa
│       │   │   ├── PonteForm.tsx                  # "Enregistrer un pontes" (rattaché à une REPRODUCTION existante)
│       │   │   ├── PonteHistoriqueTable.tsx        # NOUVEAU — liste des pontes d'une reproduction
│       │   │   ├── DistributionSexeChart.tsx       # camembert mâle/femelle
│       │   │   └── ReproductionOverviewCards.tsx
│       │   ├── hooks/
│       │   │   ├── useReproductions.ts
│       │   │   ├── usePontesReproduction.ts        # NOUVEAU — pontes d'une reproduction donnée (création/liste)
│       │   │   └── useReproductionDashboard.ts
│       │   ├── services/
│       │   │   ├── reproductionApi.ts
│       │   │   └── ponteApi.ts                     # NOUVEAU — CRUD ponte (création côté Reproduction)
│       │   └── types/
│       │       └── reproduction.types.ts
│       │
│       ├── ecloserie/
│       │   ├── components/
│       │   │   ├── EclosionForm.tsx                # sélectionne une ponte via <PonteSelector/> partagé
│       │   │   ├── PondeusesCountCard.tsx
│       │   │   └── EclosionOverviewCards.tsx
│       │   ├── hooks/
│       │   │   ├── useEclosions.ts
│       │   │   └── useEclosionDashboard.ts
│       │   ├── services/
│       │   │   └── eclosionApi.ts
│       │   └── types/
│       │       └── eclosion.types.ts               # { idPonte, dateEclosion, quantiteEclos, ... }
│       │
│       ├── traitement/
│       │   ├── components/
│       │   │   ├── TraitementForm.tsx              # ouverture
│       │   │   ├── TraitementDetailHeader.tsx
│       │   │   ├── ClotureTraitementDialog.tsx
│       │   │   └── TraitementHistoriqueTable.tsx    # historique des traitements d'un lot
│       │   ├── hooks/
│       │   │   ├── useTraitements.ts
│       │   │   ├── useTraitementDetail.ts
│       │   │   └── useMortaliteTraitement.ts        # adapte mortalite-ui à l'API traitement
│       │   ├── services/
│       │   │   └── traitementApi.ts
│       │   └── types/
│       │       └── traitement.types.ts
│       │
│       ├── stocks/
│       │   ├── components/
│       │   │   ├── LotStockageForm.tsx              # "Ajouter des lots en stock"
│       │   │   ├── SortieForm.tsx                   # sortie → vente | grossissement
│       │   │   └── StockOverviewCards.tsx           # taux de survie, historique des lots
│       │   ├── hooks/
│       │   │   ├── useLotsStockage.ts
│       │   │   ├── useMortaliteStockage.ts
│       │   │   ├── useConsommationStockage.ts       # NOUVEAU — adapte provende-ui à consommation_stockage
│       │   │   └── useTauxSurvieStock.ts
│       │   ├── services/
│       │   │   ├── stockageApi.ts
│       │   │   └── venteApi.ts
│       │   └── types/
│       │       └── stockage.types.ts
│       │
│       └── grossissement/
│           ├── components/
│           │   ├── GrossissementForm.tsx
│           │   ├── DispatchLotsBassinForm.tsx        # "un bassin peut contenir plusieurs lots"
│           │   ├── PeseeForm.tsx
│           │   ├── PeseeHistoriqueTable.tsx
│           │   ├── GmqChart.tsx
│           │   ├── BiomasseParEtapeChart.tsx
│           │   ├── IcaParEtapeTable.tsx
│           │   └── GaussDistributionChart.tsx        # distribution des poids
│           ├── hooks/
│           │   ├── useGrossissements.ts
│           │   ├── useGrossissementDetail.ts
│           │   ├── usePesees.ts
│           │   ├── useMortaliteGrossissement.ts
│           │   └── useGrossissementDashboard.ts       # calcule GMQ, ICA, biomasse à partir des pesées
│           ├── services/
│           │   └── grossissementApi.ts
│           └── types/
│               └── grossissement.types.ts
│
├── components/ui/                # design system Tailwind pur, zéro logique métier
│   ├── Button.tsx, Input.tsx, Select.tsx, Modal.tsx, Drawer.tsx,
│   ├── Table.tsx, Tabs.tsx, Card.tsx, Badge.tsx, ...
│
├── lib/
│   ├── apiClient.ts               # fetch wrapper (base URL, auth headers, gestion erreurs)
│   ├── formatters.ts              # dates, nombres, pourcentages
│   └── queryClient.ts             # config React Query (si utilisé)
│
├── hooks/                          # génériques app-wide, non métier
│   ├── useDebounce.ts
│   └── usePagination.ts
│
└── types/
    └── api.types.ts                # types transverses (pagination, réponse API générique)
```

---

## C. Rôle et contenu de chaque niveau

| Dossier | Rôle | Contient | Ne contient PAS |
|---|---|---|---|
| `app/production/*` | Routage Next.js pur | `page.tsx`/`layout.tsx` qui importent des composants de `features/production/**` et les assemblent | Logique métier, calculs, appels API directs, composants réutilisables |
| `app/production/layout.tsx` | Layout partagé du module | Nav (`Reproduction · Écloserie · Traitement · Stock · Grossissement`), zone profil, footer (issus du wireframe) | Logique spécifique à un sous-domaine |
| `features/production/<domaine>/components` | UI spécifique au domaine | Formulaires, tableaux, graphiques propres à CE domaine uniquement | Composants réutilisés par un autre domaine (→ `shared/`) |
| `features/production/<domaine>/hooks` | État + orchestration | `useXxx()` qui appellent les services et exposent un état prêt à consommer par les composants | Requêtes fetch brutes (→ `services/`), JSX |
| `features/production/<domaine>/services` | Accès aux données | Fonctions d'appel API (`fetch`, mapping DTO → types du domaine) | State React, JSX, logique de présentation |
| `features/production/<domaine>/types` | Contrats de données | Types/interfaces du domaine, alignés sur le MCD | Types génériques d'UI (boutons, etc.) |
| `features/production/shared/*` | Concepts transverses **confirmés par le MCD** | Composants/hooks/services utilisés par ≥ 2 sous-domaines | Un concept utilisé par un seul domaine "au cas où il serait réutilisé un jour" |
| `components/ui` | Design system Tailwind | Composants purement visuels sans connaissance métier | Tout ce qui connaît `Lot`, `Bassin`, `Traitement`, etc. |
| `lib`, `hooks`, `types` (racine) | Utilitaires transverses à toute l'app | Client HTTP, formatters, hooks génériques (debounce, pagination) | Logique liée à la pisciculture |

---

## D. Mapping fonctionnalités → fichiers/dossiers

| Fonctionnalité | Domaine | Emplacement proposé | Mutualisé ? |
|---|---|---|---|
| Installer un lot de géniteurs dans un hapa | Reproduction | `features/production/reproduction/components/ReproductionForm.tsx` (utilise `shared/bassins/HapaSelector`) | Non |
| Enregistrer une ponte | Reproduction | `features/production/reproduction/components/PonteForm.tsx` (rattachée à une `REPRODUCTION`, via `ponteApi.ts`) | Non |
| Sélectionner une ponte (pour créer une éclosion) | Écloserie | `features/production/shared/ponte/components/PonteSelector.tsx` | **Oui** (lecture) |
| Paramètres environnementaux | Reproduction / Écloserie / Traitement / Stocks / Grossissement | `features/production/shared/environnement/*` | **Oui** |
| Configurer le bassin et les hapas | Tous | `features/production/shared/bassins/*` | **Oui** |
| Mortalité (bassin de reproduction) | Reproduction | ❌ non suivie — confirmé avec le client, aucune table/composant à prévoir | Sans objet |
| Quantités mâles/femelles | Reproduction | `features/production/reproduction/components/DistributionSexeChart.tsx` | Non |
| Enregistrer les éclosions | Écloserie | `features/production/ecloserie/components/EclosionForm.tsx` (FK vers `PONTE`, plus vers `REPRODUCTION`) | Non |
| Quantité d'œufs / nb femelles ayant pondu | Écloserie | `features/production/ecloserie/components/EclosionOverviewCards.tsx` (quantité d'œufs désormais dérivée de `PONTE`) | Non |
| Création de lots | Écloserie → Lots | `features/production/shared/lot/*` (voir Ambiguïtés : le lot naît de l'éclosion) | **Oui** (concept), création elle-même probablement déclenchée depuis Écloserie |
| Suivi du stade / historique du lot | Lots (transverse) | `app/production/lots/[lotId]/page.tsx` + `features/production/shared/lot/components/LotHistoriqueTimeline.tsx` | **Oui** |
| Ouverture d'un traitement | Traitement | `features/production/traitement/components/TraitementForm.tsx` | Non |
| Journal de mortalité (traitement) | Traitement | UI : `shared/mortalite-ui/*` · Données : `features/production/traitement/hooks/useMortaliteTraitement.ts` + `traitementApi.ts` | **UI oui / service non** |
| Consommation de provende (traitement) | Traitement | UI : `shared/provende-ui/*` · Données : `traitementApi.ts` (endpoint `consommation_traitement`) | **UI oui / service non** |
| Dispatcher les alevins par hapa | Traitement / Stocks | `features/production/shared/bassins/components/DispatchHapaForm.tsx` | **Oui** |
| Clôturer un traitement | Traitement | `features/production/traitement/components/ClotureTraitementDialog.tsx` | Non |
| Historique des traitements d'un lot | Traitement / Lots | `features/production/traitement/components/TraitementHistoriqueTable.tsx`, affiché aussi dans `lots/[lotId]` | Partiel (composant réutilisé, pas dupliqué) |
| Ajouter des lots en stock | Stocks | `features/production/stocks/components/LotStockageForm.tsx` | Non |
| Consommation de provende (stocks) | Stocks | UI : `shared/provende-ui/*` · Données : `features/production/stocks/hooks/useConsommationStockage.ts` + `stockageApi.ts` (table `CONSOMMATION_STOCKAGE`, nouvelle) | **UI oui / service non** |
| Créer une sortie (vente / grossissement) | Stocks | `features/production/stocks/components/SortieForm.tsx` | Non |
| Taux de survie (stocks) | Stocks | `features/production/stocks/hooks/useTauxSurvieStock.ts` | Non (calcul basé sur `quantite_initiale`/mortalités propres au stockage) |
| Ouvrir un lot de grossissement | Grossissement | `features/production/grossissement/components/GrossissementForm.tsx` | Non |
| Dispatcher les lots par bassin | Grossissement | `features/production/grossissement/components/DispatchLotsBassinForm.tsx` (réutilise `BassinSelector`) | Partiel |
| Journal de pesée par étape | Grossissement | `features/production/grossissement/components/PeseeForm.tsx` / `PeseeHistoriqueTable.tsx` | Non |
| Journal de consommation de provende par étape | Grossissement | UI : `shared/provende-ui/*` · Données : `grossissementApi.ts` | **UI oui / service non** |
| GMQ, biomasse, ICA par étape, courbe de Gauss | Grossissement | `features/production/grossissement/hooks/useGrossissementDashboard.ts` + composants graphiques dédiés | Non (calculs propres à la pesée de grossissement) |
| Extraction Excel du dashboard | Grossissement (généralisable) | `features/production/shared/dashboard-ui/components/ExportExcelButton.tsx` | **Oui** (le composant bouton est générique ; le contenu exporté est fourni par le domaine) |
| KPI cards / period selector / filtres | Tous les dashboards | `features/production/shared/dashboard-ui/*` | **Oui** |

---

## E. Mutualisation

### À mutualiser (dans `features/production/shared/`)

- **Bassins/hapas** — configuration, sélection, affichage, dispatch : composants + hooks + service, car il s'agit **littéralement de la même table** (`BASSIN`, `HAPA`) partout.
- **Paramètres environnementaux** — composant, hook et service communs, car **une seule table** (`MESURE_ENVIRONNEMENTALE`) est filtrée par contexte (`id_bassin`/`id_hapa`) ; aucune raison de dupliquer.
- **Lot** — sélecteur, badge de statut, timeline d'historique : le lot est une entité pivot unique référencée par tous les sous-domaines en aval de l'éclosion.
- **Provende (UI + service catalogue)** — le *catalogue* (`PROVENDE`, `TYPE_PROVENDE`, `FOURNISSEUR`, niveaux de stock) est unique et mutualisable en service. Les *actions de consommation* restent dans le domaine appelant (voir ci-dessous).
- **Dashboard UI kit** — cartes KPI, sélecteur de période, wrapper de graphique, barre de filtres, bouton d'export : ce sont des composants de présentation sans connaissance métier, réutilisables tels quels.
- **Mortalité — présentation uniquement** — `MortaliteJournalTable` et `MortaliteForm` acceptent des props génériques (`entries`, `onSubmit`) ; **aucune donnée n'est mutualisée**, chaque domaine fournit son propre hook connecté à sa propre table.

### À NE PAS mutualiser

- **Les services de consommation de provende** (`consommation_traitement` vs `consommation_grossissement`) : deux endpoints/tables distincts avec des règles potentiellement différentes (ex. notion d'`etape` uniquement en grossissement). Mutualiser le service créerait un couplage artificiel entre deux tables qui n'ont en commun que la clé `id_provende`.
- **Les services de mortalité** (`mortalite_traitement`, `mortalite_stockage`, `mortalite_grossissement`) : trois tables, trois FK parentes différentes → trois hooks/services distincts qui, chacun, adaptent les données au composant UI partagé.
- **Les dashboards métier eux-mêmes** (GMQ, ICA, courbe de Gauss, distribution mâle/femelle...) : les *indicateurs* sont propres à chaque domaine, seuls les *blocs visuels génériques* (carte, graphique, filtre) sont mutualisés.
- **Les formulaires de saisie métier** (ponte, éclosion, ouverture de traitement, pesée...) : structure de champs différente à chaque fois, une généralisation forcerait un composant à `switch` sur le domaine — signe classique de sur-ingénierie à éviter (cf. contrainte "ne pas rendre générique un composant qui a des comportements métier différents").

---

## F. Structure de routes

```
/production                          → redirection vers un sous-module par défaut (ex: /production/reproduction)
/production/reproduction             → vue d'ensemble (dashboard + actions), cf. wireframe
/production/ecloserie                → vue d'ensemble
/production/lots                     → liste/recherche des lots
/production/lots/[lotId]             → détail + historique transverse (éclosion → traitement(s) → stockage → grossissement → vente)
/production/traitement               → liste + dashboard des traitements
/production/traitement/nouveau       → ouverture d'un traitement
/production/traitement/[traitementId] → détail (mortalité, provende, dispatch, clôture)
/production/stocks                   → liste des lots en stock + dashboard
/production/stocks/[lotStockageId]   → détail (mortalité, provende, sortie)
/production/grossissement            → liste + dashboard global
/production/grossissement/nouveau    → ouverture d'un cycle
/production/grossissement/[grossissementId] → détail (pesées, mortalité, provende, dispatch, clôture)
```

Remarques :
- Les actions "Paramètres environnementaux" et "Configurations Bassins" du wireframe ne deviennent **pas des routes** : ce sont des modales/drawers ouvertes depuis la page du sous-domaine, car le wireframe les traite comme des boutons d'action contextuels plutôt que comme des pages de destination.
- Les paramètres dynamiques (`[lotId]`, `[traitementId]`, `[grossissementId]`, `[lotStockageId]`) suivent la convention App Router et permettent des `loading.tsx`/`error.tsx` par route si besoin plus tard.

---

## G. Exemple concret détaillé — Grossissement

```
app/production/grossissement/
├── page.tsx                 # Server Component : fetch liste + KPIs globaux, rend <GrossissementListPage/>
├── nouveau/page.tsx          # Server Component wrapper + <GrossissementForm/> (Client)
└── [grossissementId]/
    └── page.tsx              # Server Component : fetch détail, rend les sections (pesées, mortalité, provende...)

features/production/grossissement/
├── components/
│   ├── GrossissementForm.tsx          (Client — formulaire ouverture)
│   ├── DispatchLotsBassinForm.tsx     (Client — réutilise <BassinSelector/> et <LotSelector/> partagés)
│   ├── PeseeForm.tsx                  (Client)
│   ├── PeseeHistoriqueTable.tsx       (Server ou Client selon interactivité du tri/filtre)
│   ├── GmqChart.tsx                   (Client — Recharts)
│   ├── BiomasseParEtapeChart.tsx      (Client)
│   ├── IcaParEtapeTable.tsx           (Server)
│   └── GaussDistributionChart.tsx     (Client)
├── hooks/
│   ├── useGrossissements.ts
│   ├── useGrossissementDetail.ts
│   ├── usePesees.ts
│   ├── useMortaliteGrossissement.ts   # adapte les données de mortalite_grossissement au composant partagé
│   └── useGrossissementDashboard.ts   # dérive GMQ / ICA / biomasse à partir des pesées + provende
├── services/
│   └── grossissementApi.ts            # CRUD grossissement, pesées, mortalité, consommation
└── types/
    └── grossissement.types.ts

# Éléments réellement communs utilisés par Grossissement, définis EN DEHORS de son dossier :
features/production/shared/bassins/components/BassinSelector.tsx      → sélection du bassin de destination
features/production/shared/bassins/components/DispatchHapaForm.tsx    → non utilisé ici (grossissement dispatch par BASSIN, pas par hapa)
features/production/shared/lot/components/LotSelector.tsx             → sélection des lots à intégrer au cycle
features/production/shared/mortalite-ui/components/MortaliteJournalTable.tsx → affichage du journal, alimenté par useMortaliteGrossissement
features/production/shared/provende-ui/components/ConsommationProvendeForm.tsx → saisie de la consommation par étape
features/production/shared/environnement/components/ParametresEnvironnementauxPanel.tsx → carte dashboard
features/production/shared/dashboard-ui/components/KpiCard.tsx, ChartWrapper.tsx, ExportExcelButton.tsx → mise en forme des indicateurs
```

Un composant Client (ex. `PeseeForm.tsx`) est isolé du Server Component de la page : la page `[grossissementId]/page.tsx` reste un Server Component qui fait le fetch initial (SSR, meilleur TTFB) et passe les données en props aux composants interactifs, conformément aux conventions App Router.

---

## H. Vérification finale

| Critère | Statut | Justification |
|---|---|---|
| Cohérence avec le MCD | ✅ | Chaque dossier `shared/*` correspond à une table réellement transverse ; chaque dossier de domaine correspond aux entités qui lui sont propres (`TRAITEMENT`, `GROSSISSEMENT`...) |
| Cohérence avec le wireframe | ✅ | Layout de nav commun au niveau module ; actions "Paramètres environnementaux"/"Bassins" traitées comme contextuelles (modales) et non comme routes, conformément à leur présentation en boutons |
| Lisibilité | ✅ | "Tout ce qui concerne le traitement" = un seul dossier `features/production/traitement` ; pas de dispersion technique (pas de dossier `forms/` global mélangeant tous les domaines) |
| Maintenabilité | ✅ | Séparation stricte UI / hooks / services / types dans chaque domaine ; une modification de l'API d'un domaine ne touche que son fichier `services/` |
| Réutilisabilité | ✅ | Les 6 concepts réellement partagés (bassins, environnement, lot, provende-UI, mortalité-UI, dashboard-UI) sont centralisés une seule fois |
| Faible duplication | ✅ | Aucun formulaire/tableau dupliqué ; les formes communes (mortalité, KPI) sont factorisées au niveau composant |
| Faible couplage | ✅ | Les services de mortalité/provende restent séparés par domaine : un changement de règle métier en Grossissement ne peut pas casser Traitement |
| Évolutivité | ✅ | Ajouter un 6ᵉ sous-domaine = ajouter un dossier `features/production/<nouveau>` + une route, sans toucher à l'existant |
| Simplicité | ✅ | Pas de couche d'abstraction générique (pas de "MortaliteService<T>" générique) ; les adaptations restent explicites dans chaque hook de domaine |
| Compatibilité Next.js + TS + Tailwind | ✅ | `app/` respecte les conventions App Router (`page.tsx`, `layout.tsx`, segments dynamiques) ; `components/ui` est le socle Tailwind ; tout le code métier est typé via les dossiers `types/` alignés sur le MCD |

---

## Ambiguïtés — statut après vos précisions

1. ✅ **Résolu — Mortalité en Reproduction.** Confirmé : elle n'est pas suivie au niveau du bassin de reproduction. Aucune table `MORTALITE_REPRODUCTION`, aucun composant de mortalité prévu pour ce domaine.
   Conséquence structurelle demandée en parallèle : `REPRODUCTION` représente désormais un **lot de géniteurs installé dans un hapa** (colonne `id_hapa` ajoutée), la quantité d'œufs est déplacée vers une nouvelle table **`PONTE`** (`id_reproduction` FK, `date_ponte`, `quantite_oeufs`, `observation` — une reproduction peut donner lieu à plusieurs pontes dans le temps), et **`ECLOSION`** est désormais rattachée à `PONTE` (`id_ponte`, UNIQUE) et non plus directement à `REPRODUCTION`. Cela a été répercuté :
   - dans le script SQL (tables `reproduction`, `ponte`, `eclosion` revues) ;
   - dans l'architecture : `ReproductionForm.tsx` (installation des géniteurs) et `PonteForm.tsx` (enregistrement d'une ponte) sont désormais deux actions distinctes du domaine Reproduction ; un module transverse léger `features/production/shared/ponte/` expose un `PonteSelector` en lecture seule pour que le domaine Écloserie puisse rattacher une éclosion à la bonne ponte, sans dupliquer la logique de création qui reste dans Reproduction.

2. ⏳ **Non traité (à votre demande).** Un onglet "Lots" sera ajouté au wireframe. La structure `/production/lots` proposée reste valable telle quelle une fois le wireframe mis à jour.

3. ⏳ **Non traité (à votre demande).** Le mode de création du lot (automatique à l'éclosion vs étape manuelle) sera confirmé avec l'entreprise. Comme indiqué précédemment, l'architecture proposée (dossier transverse `features/production/shared/lot/`) reste valable dans les deux cas.

4. ✅ **Résolu — Consommation de provende en Stocks.** Une table **`CONSOMMATION_STOCKAGE`** a été ajoutée au script SQL, sur le même patron que `CONSOMMATION_TRAITEMENT`/`CONSOMMATION_GROSSISSEMENT` (rattachée au couple `id_lot`/`id_hapa` de `LOT_STOCKAGE`). Côté architecture, le domaine Stocks gagne un hook `useConsommationStockage.ts` qui réutilise les composants `shared/provende-ui/*` déjà prévus — aucune nouvelle mutualisation nécessaire, le patron "UI partagée / service par domaine" déjà retenu pour Traitement et Grossissement s'applique tel quel.

5. ⏳ **Non traité (à votre demande).** La structure actuelle (dispatch par hapa en Traitement/Stocks, par bassin en Grossissement, via deux composants distincts dans `shared/bassins/`) est conservée sans modification.
