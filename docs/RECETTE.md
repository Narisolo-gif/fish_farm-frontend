# Recette manuelle du frontend

Une checklist par écran et par rôle, à dérouler sur le frontend branché au backend local. Les règles attendues viennent du [guide d'intégration du backend](../../fish_farm-backend/context/GUIDE_INTEGRATION_FRONTEND.md). L'état des écrans est suivi dans [INTEGRATION.md](INTEGRATION.md).

## Préparation

1. Backend lancé (voir le README du dépôt `fish_farm-backend`), migrations appliquées.
2. Données de démonstration : `python manage.py seed_grossissement` (lots préfixés `SIM-`).
3. Un compte par rôle, au statut `ACTIF`. La commande exacte est dans `fish_farm-backend/tests/postman/README_TEST.md` (section « comptes ») :
   - `admin_demo` : Administrateur ;
   - `directeur_demo` : Directeur ;
   - `gestionnaire_demo` : Gestionnaire ;
   - `employe_demo` : Employé.
4. Frontend : `npm run dev`, avec `NEXT_PUBLIC_API_URL=http://localhost:8000`.

Rôles : **A** Administrateur, **D** Directeur, **G** Gestionnaire, **E** Employé.

## Contrôles communs (à chaque écran)

- Déconnecté : redirection vers `/login`.
- Jeton d'accès expiré : la page se recharge sans déconnexion. Pour le tester, remplacer `access_token` par une valeur fausse dans les DevTools.
- Refresh invalide : retour à `/login`.
- 403 renvoyé par le backend : message « Vous n'avez pas les droits nécessaires pour cette action. », sans page blanche.
- 400 : chaque message s'affiche sous son champ ; un message général s'affiche en tête.

## Modèle de checklist

Copier ce bloc pour chaque écran.

### <Écran> (`<route>`, guide § <n>)

| Rôle | Visible | Masqué | Parcours nominal | Refus attendus |
|---|---|---|---|---|
| A | | | | |
| D | | | | |
| G | | | | |
| E | | | | |

Cas limites : …

## Exemple : traitement, clôture (`/production/traitement/[id]`, guide § 4.2)

| Rôle | Visible | Masqué | Parcours nominal | Refus attendus |
|---|---|---|---|---|
| A | « Clôturer » | — | Comme D | — |
| D | « Clôturer » | — | « Clôturer » → aperçu en lecture seule (effectifs, morts et pertes, taux de survie) → « OK » → traitement `CLOTUREE` → « Mettre en stock maintenant ? » : « Oui » ouvre la mise en stock préremplie | — |
| G | aperçu en lecture | « Clôturer » | Lecture seule | `POST cloturer/` → 403 si appelé |
| E | aperçu en lecture, saisie de mortalité tant que le traitement est en cours | « Clôturer » | Lecture et saisie | `POST cloturer/` → 403 si appelé |

Cas limites :
- date de clôture future, ou antérieure à l'ouverture : `cloturable` est faux, `raison_refus` s'affiche et « OK » est désactivé ;
- date antérieure à un mouvement des hapas : même comportement ;
- « Non » au dialogue de mise en stock : le lot reste `EN_TRAITEMENT` et toute mortalité ou perte sur ses hapas est refusée ;
- traitement déjà clôturé : l'aperçu montre la vraie date de clôture et le bouton n'apparaît plus.

## À automatiser plus tard (Playwright)

Phase suivante, rien n'est installé pour l'instant. Un parcours par rôle sur la base `seed_grossissement` :

- **D** : lot → traitement → clôture → mise en stock → sortie vers le grossissement → pesée → clôture → évacuation ;
- **E** : saisie de mortalité, de perte, de distribution de provende et de pesée ; aucun bouton de décision visible ;
- **G** : création, modification et désactivation d'un compte ; production en lecture seule ; impossible d'attribuer le rôle Administrateur ;
- **A** : tout est accessible, y compris l'attribution du rôle Administrateur.
