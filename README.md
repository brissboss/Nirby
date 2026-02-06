[![CI/CD](https://github.com/brissboss/Nirby/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/brissboss/Nirby/actions/workflows/ci-cd.yaml)

# Nirby

Application full-stack de cartographie des lieux d’intérêt (POI) : API Express, front Next.js, PostgreSQL (PostGIS), Redis et stockage objet (S3-compatible) pour les fichiers.

Deux façons de lancer l’app en **local** : **mode dev** (API + front avec `pnpm dev`, le reste en Docker) ou **mode tout en Docker** (DB, Redis, Minio, API et front dans des conteneurs sur ta machine, sans pnpm).

---

## Prérequis

- **Node.js** 20+ et **pnpm** 10.14+ (obligatoires pour le mode dev, optionnels si tu ne lances qu’en mode tout en Docker)
- **Docker** et **Docker Compose**

---

## 1. Cloner le projet

```bash
git clone https://github.com/brissboss/Nirby.git
cd Nirby
```

---

## 2. Installer les dépendances

À la racine du monorepo :

```bash
pnpm install
```

---

## 3. Configuration

La configuration ci-dessous est **nécessaire uniquement pour le mode dev** (API et front lancés avec `pnpm dev`). En mode tout en Docker, l’API et le front utilisent les variables du `docker-compose` (et optionnellement `infra/.env`).

### Mode local : fichier `.env` de l’API

Créez `apps/api/.env` à partir de l’exemple :

```bash
cp apps/api/.env.example apps/api/.env
```

Renseignez au minimum :

- **Base de données et Redis** : `DATABASE_URL="postgresql://nirby:nirby@localhost:5432/nirby"`, `REDIS_URL="redis://localhost:6379"`
- **Serveur** : `PORT=4000`, `LOG_LEVEL=info`
- **Auth** : `JWT_SECRET=` (générez avec `openssl rand -base64 64`)
- **Stockage (Minio)** : `S3_BUCKET=nirby-uploads-dev`, `S3_REGION=eu-west-3`, `S3_ACCESS_KEY_ID=nirbyadmin`, `S3_SECRET_ACCESS_KEY=nirbyadmin123`, `S3_ENDPOINT=http://localhost:9000`, `S3_PUBLIC_URL=http://localhost:9000/nirby-uploads-dev`

### Mode local : front (optionnel)

Pour la clé Mapbox, créez `apps/web/.env.local` avec `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=votre_token`. L’URL de l’API par défaut est déjà `http://localhost:4000`.

### Mode tout en Docker : variable pour le build du front

Pour que la carte Mapbox fonctionne dans le front en Docker, vous pouvez passer le token au build. Depuis `infra/`, créez un fichier `.env` (ou exportez) avec :

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=votre_token_mapbox
```

Puis `docker-compose up --build`. Sans cette variable, le front se build et tourne quand même, mais la carte ne s’affichera pas.

---

## 4. Lancer l’application

Deux options pour faire tourner l’app **sur ta machine** : **mode dev** (pnpm + Docker pour l’infra) ou **mode tout en Docker** (tout en conteneurs, sans pnpm).

---

### Mode dev — API et front avec pnpm, le reste en Docker

Adapté au développement (hot-reload sur l’API et le front).

1. **Démarrer l’infrastructure** (DB, Redis, Minio) **sans** l’API ni le front :

```bash
cd infra
docker-compose up -d db redis minio mc-init
```

Optionnel : ajoutez `adminer` pour une interface web sur la BDD (`docker-compose up -d db redis minio mc-init adminer`).

2. **Configurer l’API** : créez `apps/api/.env` (section 3) et appliquez les migrations au premier lancement :

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
cd ../..
```

3. **Lancer l’API et le front** à la racine :

```bash
pnpm dev
```

- **Front** : http://localhost:3000
- **API** : http://localhost:4000

Ouvrez http://localhost:3000 dans le navigateur.

---

### Mode local — tout en Docker (API et front inclus)

Tous les services tournent dans Docker sur ta machine : DB, Redis, Minio, API et front. Aucun `pnpm` ni `.env` dans `apps/api` n’est nécessaire pour faire tourner l’appli. Utile pour une démo ou tester la stack complète sans lancer Node en local.

1. **Construire et démarrer tous les services** :

```bash
cd infra
docker-compose up -d --build
```

Cela lance : PostgreSQL (PostGIS), Redis, Minio, mc-init, Adminer, **l’API** (migrations appliquées au démarrage) et le **front**. Le premier `--build` peut prendre quelques minutes (build des images API et web).

2. **Accéder à l’application** :

- **Front** : http://localhost:3000
- **API** : http://localhost:4000 (docs : http://localhost:4000/docs)

Pour reconstruire après des changements de code : `docker-compose up -d --build`.

**Variables d’environnement** : Docker Compose charge automatiquement un fichier `infra/.env` s’il existe. Sans ce fichier, des valeurs par défaut permettent de lancer l’appli (JWT et Resend factices, Minio en local). Pour configurer les vrais services (Google Places, Resend, S3, etc.) :

1. Copiez le modèle : `cp infra/.env.example infra/.env`
2. Éditez `infra/.env` et renseignez au moins `JWT_SECRET` et, si besoin, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `FRONTEND_URL`, etc.
3. Relancez : `docker-compose up -d --build`

Le build du front peut utiliser `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (et optionnellement `NEXT_PUBLIC_API_URL`) depuis ce même `.env`.

---

## Récapitulatif des services en local

| Service           | URL / Connexion              | Rôle                                   |
| ----------------- | ---------------------------- | -------------------------------------- |
| Front (Next.js)   | http://localhost:3000        | Interface utilisateur                  |
| API (Express)     | http://localhost:4000        | Back-end (health: /health, /db/health) |
| Documentation API | http://localhost:4000/docs   | Swagger / Scalar                       |
| PostgreSQL        | localhost:5432 (nirby/nirby) | Base de données (PostGIS)              |
| Redis             | localhost:6379               | Cache / sessions                       |
| Minio             | http://localhost:9000        | Stockage S3-compatible (uploads)       |
| Minio Console     | http://localhost:9001        | Interface d’administration Minio       |
| Adminer           | http://localhost:8080        | Interface web BDD (si lancé)           |

---

## Arrêter les services

- **Mode dev** : `Ctrl+C` dans le terminal où tourne `pnpm dev`, puis depuis `infra/` : `docker-compose down`.
- **Mode tout en Docker** : depuis `infra/`, `docker-compose down`.

---

## Déploiement (staging / production)

Le déploiement en **staging** et en **production** est géré par la **CI/CD** (voir [.github/workflows/ci-cd.yaml](.github/workflows/ci-cd.yaml)). Un push sur la branche `staging` ou `main` déclenche le build des images Docker, leur envoi sur le serveur, puis l’exécution de **`infra/staging/docker-compose.yaml`** ou **`infra/prod/docker-compose.yaml`** sur le serveur. Les variables d’environnement (secrets, URLs, etc.) sont injectées par GitHub Actions.

Le fichier **`infra/docker-compose.yaml`** à la racine de `infra/` sert uniquement au **lancement local** (mode « tout en Docker » ci-dessus) ; il n’est pas utilisé par la CI pour le déploiement réel.

---

## Base de données (Prisma)

- **Créer une migration** : `cd apps/api && pnpm prisma:migrate`
- **Régénérer le client** : `cd apps/api && pnpm prisma:generate`
- **Ouvrir Prisma Studio** : `cd apps/api && npx prisma studio`

---

## Structure du projet

```
.
├── apps/
│   ├── api/          # API Express (TypeScript, Prisma)
│   │   ├── prisma/   # Schéma et migrations
│   │   └── src/      # Code source
│   └── web/          # Front Next.js (React, Tailwind, shadcn/ui)
├── infra/
│   ├── docker-compose.yaml   # Lancement local tout en Docker (DB, Redis, Minio, API, Web)
│   ├── staging/              # Utilisé par la CI pour le déploiement staging
│   └── prod/                 # Utilisé par la CI pour le déploiement production
├── docs/
└── pnpm-workspace.yaml      # Monorepo (pnpm + Turborepo)
```

---

## Scripts utiles

**À la racine :**

- `pnpm build` — Build de tous les packages
- `pnpm dev` — Lance l’API et le front en mode développement
- `pnpm lint` — Lint
- `pnpm test` — Tests

**API (`apps/api`) :**

- `pnpm dev` — API en mode développement (hot-reload)
- `pnpm prisma:migrate` — Créer / appliquer les migrations
- `pnpm prisma:generate` — Générer le client Prisma

**Web (`apps/web`) :**

- `pnpm dev` — Lancer uniquement le front (Next.js)

---

## Stack technique

- **API** : Express, TypeScript, Prisma, Pino
- **Base de données** : PostgreSQL avec PostGIS
- **Cache** : Redis
- **Stockage fichiers** : S3-compatible (AWS en prod, Minio en local)
- **Front** : Next.js, React, Tailwind CSS, shadcn/ui, Mapbox
- **Monorepo** : pnpm, Turborepo
- **Containerisation** : Docker
