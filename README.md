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

- **Base de données et Redis** : `DATABASE_URL="postgresql://nirby:nirby@localhost:5432/nirby"`, `REDIS_URL="redis://localhost:6379"`. Pour la Prisma CLI (migrations), voir [Base de données (Prisma)](#base-de-données-prisma) — en dev, une seule `DATABASE_URL` suffit en général.
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

### Mode local — tout en Docker (API et front inclus)

Tous les services tournent dans Docker sur ta machine : DB, Redis, Minio, API et front. Aucun `pnpm` ni `.env` dans `apps/api` n’est nécessaire pour faire tourner l’appli. Utile pour une démo ou tester la stack complète sans lancer Node en local.

1. **Construire et démarrer tous les services** :

```bash
cd infra
docker-compose up -d --build
```

Cela lance notamment : PostgreSQL (PostGIS), Redis, Minio, mc-init, Adminer, **l’API** (migrations au démarrage) et le **front**. Le premier `--build` peut prendre quelques minutes.

2. **Accéder à l’application** :

- **Front** : http://localhost:3000
- **API** : http://localhost:4000 (docs : http://localhost:4000/docs)

Pour reconstruire après des changements de code : `docker-compose up -d --build`.

**Variables d’environnement** : Docker Compose charge automatiquement un fichier `infra/.env` s’il existe. Sans ce fichier, des valeurs par défaut permettent de lancer l’appli (JWT et Resend factices, Minio en local). Pour configurer les vrais services :

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

Le déploiement est géré par la **CI/CD** ([.github/workflows/ci-cd.yaml](.github/workflows/ci-cd.yaml)) : build des images, copie sur le serveur, puis **`infra/staging/docker-compose.yaml`** ou **`infra/prod/docker-compose.yaml`**.

**Secrets GitHub utiles pour PostgreSQL** (staging / prod) :

- **`DB_PASSWORD`** — mot de passe de l’utilisateur `nirby` (migrations Prisma, rôle « complet » côté base).
- **`DB_APP_PASSWORD`** — mot de passe du rôle applicatif **`nirby_app`** (connexion de l’API : `DATABASE_URL` dans le compose).

Au **premier** démarrage avec un **volume PostgreSQL vide**, les scripts dans `infra/staging/db-init/` et `infra/prod/db-init/` (montés en `docker-entrypoint-initdb.d`) créent `nirby_app` et configurent les privilèges par défaut. Si une base a été créée **avant** cette logique, il faut soit **recréer le volume** (`docker compose down -v`, perte des données), soit exécuter une fois l’équivalent SQL sur le serveur.

**Fichier local** : `infra/docker-compose.yaml` sert **uniquement** au lancement **sur ta machine** ; il n’est pas le fichier utilisé par la CI pour staging/prod.

---

## Base de données (Prisma)

Le projet utilise **Prisma ORM 7** :

- **`apps/api/prisma/schema.prisma`** — modèle de données ; le bloc `datasource` n’y contient **pas** l’URL de connexion.
- **`apps/api/prisma.config.ts`** — URL pour la CLI : `MIGRATE_DATABASE_URL`, ou à défaut **`DATABASE_URL`**.
- **`apps/api/src/db.ts`** — client runtime avec **`@prisma/adapter-pg`** et **`DATABASE_URL`**.

**En développement local**, un seul utilisateur `nirby` et une seule `DATABASE_URL` dans `apps/api/.env` suffisent habituellement.

**En staging / production**, le compose distingue **`MIGRATE_DATABASE_URL`** (utilisateur `nirby`) et **`DATABASE_URL`** (utilisateur `nirby_app`) pour appliquer le principe de moindre privilège côté PostgreSQL.

Commandes usuelles :

- **Créer / appliquer des migrations** : `cd apps/api && pnpm prisma:migrate`
- **Régénérer le client** : `cd apps/api && pnpm prisma:generate`
- **Prisma Studio** : `cd apps/api && npx prisma studio`

---

## Structure du projet

```
.
├── apps/
│   ├── api/              # API Express (TypeScript, Prisma)
│   │   ├── prisma/       # Schéma et migrations
│   │   ├── prisma.config.ts
│   │   └── src/
│   └── web/              # Front Next.js
├── infra/
│   ├── docker-compose.yaml   # Local « tout en Docker »
│   ├── staging/              # Déploiement staging (CI)
│   └── prod/                 # Déploiement production (CI)
├── docs/
└── pnpm-workspace.yaml
```

---

## Scripts utiles

**À la racine :**

- `pnpm build` — Build de tous les packages
- `pnpm dev` — API + front en développement
- `pnpm lint` — Lint
- `pnpm test` — Tests

**API (`apps/api`) :**

- `pnpm dev` — API en hot-reload
- `pnpm prisma:migrate` — Migrations
- `pnpm prisma:generate` — Client Prisma

**Web (`apps/web`) :**

- `pnpm dev` — Front Next.js seul

---

## Stack technique

- **API** : Express, TypeScript, Prisma, Pino
- **Base de données** : PostgreSQL avec PostGIS
- **Cache** : Redis
- **Stockage fichiers** : S3-compatible (AWS en prod, Minio en local)
- **Front** : Next.js, React, Tailwind CSS, shadcn/ui, Mapbox
- **Monorepo** : pnpm, Turborepo
- **Containerisation** : Docker
