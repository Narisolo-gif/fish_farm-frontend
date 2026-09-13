# Fish Farm Anosy — frontend

Squelette frontend de l'application de pilotage piscicole, construit avec Next.js, React et TypeScript. Il reprend la hiérarchie des wireframes et fournit une navigation fonctionnelle avec des données mockées.

## Installation

Pré-requis : Node.js 20+ et npm.

```bash
npm install
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

Pour vérifier la version de production :

```bash
npm run build
npm start
```

## Routes principales

- `/` : accueil et accès aux modules
- `/login` : écran de connexion
- `/dashboard` : indicateurs, graphiques placeholders et alertes
- `/production` : vue des cinq modules
- `/production/[module]` : dashboard d'un module
- `/production/[module]/lots` : liste des lots
- `/production/[module]/basins` : liste des bassins
- `/basins/new` : formulaire de bassin
- `/stock` : stock de provendes et mouvements
- `/orders` : liste des commandes
- `/orders/[reference]` : détail d'une commande
- `/users` et `/users/new` : utilisateurs et formulaire

## Structure

```text
src/
├── app/                 # routes App Router et styles globaux
├── components/          # shell, en-têtes, boutons, tableaux et cartes
└── lib/                 # données mockées et types partagés
```

Le backend, l'authentification réelle, les appels API et les interactions métier sont volontairement laissés pour les prochaines étapes.
