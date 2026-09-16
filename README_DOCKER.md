# Fish Farm Anosy — frontend

Frontend de l'application de pilotage piscicole **Fish Farm Anosy**, construit avec **Next.js, React et TypeScript**.

Le projet reprend la hiérarchie des wireframes et fournit une navigation fonctionnelle avec des données mockées.

L'application frontend est **dockerisée** et peut être lancée via Docker Compose.

---

## Prérequis

Pour le lancement recommandé :

* Docker Desktop
* Docker Compose

Versions utilisées lors de la mise en place du projet :

```text
Docker 29.6.2
Docker Compose v5.3.1
```

Node.js et npm ne sont pas nécessaires sur la machine pour le lancement via Docker.

---

## Lancement avec Docker

Depuis la racine du projet :

```bash
docker compose up --build
```

L'application est ensuite accessible à :

```text
http://localhost:3000
```

### Lancer en arrière-plan

Pour démarrer les conteneurs sans conserver les logs dans le terminal :

```bash
docker compose up --build -d
```

### Vérifier les conteneurs

```bash
docker compose ps
```

Le service frontend doit apparaître avec le port :

```text
0.0.0.0:3000->3000/tcp
```

### Arrêter l'application

```bash
docker compose down
```

---

## Développement

Le projet utilise un volume Docker permettant de travailler directement avec le code source local.

Les modifications apportées aux fichiers du projet sont ainsi prises en compte par le serveur Next.js de développement.

Pour consulter les logs :

```bash
docker compose logs -f frontend
```

Pour arrêter les conteneurs :

```bash
docker compose down
```

---

## Vérification du code

Le linting peut être exécuté directement dans le conteneur :

```bash
docker compose exec frontend npm run lint
```

---

## Build de production

Pour vérifier que l'application peut être compilée pour la production :

```bash
docker compose exec frontend npm run build
```

Le démarrage de production peut ensuite être testé avec :

```bash
docker compose exec frontend npm start
```

> Le `docker-compose.yml` actuel est configuré pour le serveur de développement Next.js. Le lancement de production avec `npm start` est donc principalement destiné à une vérification ponctuelle du build.

---

## Routes principales

* `/` : accueil et accès aux modules
* `/login` : écran de connexion
* `/dashboard` : indicateurs, graphiques placeholders et alertes
* `/production` : vue des cinq modules
* `/production/[module]` : dashboard d'un module
* `/production/[module]/lots` : liste des lots
* `/production/[module]/basins` : liste des bassins
* `/basins/new` : formulaire de bassin
* `/stock` : stock de provendes et mouvements
* `/orders` : liste des commandes
* `/orders/[reference]` : détail d'une commande
* `/users` et `/users/new` : utilisateurs et formulaire

---

## Structure

```text
src/
├── app/                    # routes App Router et styles globaux
├── components/             # shell, en-têtes, boutons, tableaux et cartes
└── lib/                    # données mockées et types partagés
```

---

## Docker

Les principaux fichiers liés à la conteneurisation sont :

```text
Dockerfile
docker-compose.yml
.dockerignore
```

Le frontend est exécuté dans un conteneur Node.js et exposé sur le port `3000`.

Les dépendances npm sont installées lors de la construction de l'image avec :

```bash
npm ci
```

---

## Git

Le projet est versionné avec Git.

La branche principale est :

```text
main
```

Les développements peuvent être réalisés sur des branches dédiées avant leur intégration dans `main`.

Exemple :

```bash
git checkout -b feature/nom-de-la-feature
```

---

## État actuel du projet

Le frontend constitue actuellement le **squelette fonctionnel** de l'application.

Les éléments suivants sont prévus pour les prochaines étapes :

* connexion au backend Django REST ;
* appels API réels ;
* authentification réelle ;
* gestion des données métier ;
* interactions avec la base de données ;
* remplacement progressif des données mockées.

Le backend n'est donc pas encore intégré au frontend à ce stade.
