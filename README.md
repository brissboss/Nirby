# Nirby

[![CI/CD](https://github.com/brissboss/Nirby/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/brissboss/Nirby/actions/workflows/ci-cd.yaml)

Application web de **cartographie personnalisée des lieux d’intérêt (POI)** : carte Mapbox, listes collaboratives, recherche Google Places, auth et stockage de médias.

| Environnement | Front                                | API                                              |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| Local         | http://localhost:3000                | http://localhost:4000                            |
| Staging       | https://staging.nirby.theobrissiaud.fr | https://staging.api.nirby.theobrissiaud.fr     |
| Production    | https://nirby.theobrissiaud.fr       | https://api.nirby.theobrissiaud.fr               |

Docs API (Swagger / Scalar) : `http://localhost:4000/docs` en local.

---

## Sommaire

1. [Ce que fait Nirby](#ce-que-fait-nirby)
2. [Stack](#stack)
3. [Prérequis](#prérequis)
4. [Installation locale (recommandé)](#installation-locale-recommandé)
5. [Alternative : tout en Docker](#alternative--tout-en-docker)
6. [Services locaux](#services-locaux)
7. [Base de données](#base-de-données)
8. [Données de démo](#données-de-démo)
9. [Scripts utiles](#scripts-utiles)
10. [Tests](#tests)
11. [Déploiement](#déploiement)
12. [Rollback et backups](#rollback-et-backups)
13. [Structure du repo](#structure-du-repo)
14. [Documentation](#documentation)

---

## Ce que fait Nirby

- Carte Mapbox consultable **sans compte**, avec filtres (pays, ville, tags, listes, géoloc).
- Compte requis pour **créer des listes**, ajouter / éditer des POI, joindre des photos, collaborer.
- Recherche de lieux via **Google Places**, ou ajout manuel sur la carte.
- Listes **hiérarchiques**, partageables, avec rôles collaborateur.
- POI : photos, description, notes, tags, statut (à faire / fait).
- Compte : vérification email, export RGPD, suppression de compte.

---

## Stack

| Couche   | Techno                                                    |
| -------- | --------------------------------------------------------- |
| Front    | Next.js, React, Tailwind, shadcn/ui, Mapbox, next-intl    |
| API      | Express, TypeScript, Prisma 7, Pino                       |
| Base     | PostgreSQL + PostGIS                                      |
| Cache    | Redis                                                     |
| Fichiers | S3-compatible (MinIO en local, AWS en staging/prod)       |
| Emails   | Resend                                                    |
| Monorepo | pnpm + Turborepo                                          |
| CI/CD    | GitHub Actions → VPS Docker Compose                       |

---

## Prérequis

**Mode dev** (le plus courant) :

- [Node.js](https://nodejs.org/) **20+**
- [pnpm](https://pnpm.io/) **10.14+** — `corepack enable && corepack prepare pnpm@10.14.0 --activate`
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

**Optionnel selon les features :**

| Clé                                                                              | À quoi ça sert                         | Sans elle…                          |
| -------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------- |
| Token [Mapbox](https://account.mapbox.com/)                                      | Afficher la carte                      | L’app tourne, la carte est vide     |
| Clé [Google Places](https://developers.google.com/maps/documentation/places/web-service) | Recherche de lieux               | Pas de suggestions Google           |
| Clé [Resend](https://resend.com)                                                 | Emails (vérif, reset, invitations)     | Auth possible, pas d’emails         |

---

## Installation locale (recommandé)

Infra en Docker (DB, Redis, MinIO). API et front en hot-reload avec `pnpm`.

### 1. Cloner et installer

```bash
git clone https://github.com/brissboss/Nirby.git
cd Nirby
pnpm install
```

### 2. Configurer l’API

```bash
cp apps/api/.env.example apps/api/.env
```

Dans `apps/api/.env`, au minimum :

```env
DATABASE_URL="postgresql://nirby:nirby@localhost:5432/nirby"
REDIS_URL="redis://localhost:6379"
PORT=4000
NODE_ENV=development
LOG_LEVEL=info

# openssl rand -base64 64
JWT_SECRET=

S3_BUCKET=nirby-uploads-dev
S3_REGION=eu-west-3
S3_ACCESS_KEY_ID=nirbyadmin
S3_SECRET_ACCESS_KEY=nirbyadmin123
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000/nirby-uploads-dev
```

Le reste (Resend, Google Places, Sentry, templates email) est optionnel en local.

### 3. Configurer le front (carte)

```bash
cp apps/web/.env.example apps/web/.env.local
```

Renseigner `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=…`.  
L’URL de l’API vaut déjà `http://localhost:4000` par défaut.

### 4. Démarrer l’infra

```bash
cd infra
docker compose up -d db redis minio mc-init
```

Optionnel : `adminer` pour une UI BDD sur http://localhost:8080

```bash
docker compose up -d adminer
```

### 5. Migrations

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
```

### 6. Lancer API + front

À la racine du repo :

```bash
pnpm dev
```

- Front : http://localhost:3000
- API : http://localhost:4000
- Docs API : http://localhost:4000/docs

Arrêt : `Ctrl+C`, puis `cd infra && docker compose down`.

---

## Alternative : tout en Docker

Utile pour une démo ou tester la stack sans Node en local. Aucun `apps/api/.env` n’est requis.

```bash
cd infra
cp .env.example .env   # optionnel, voir ci-dessous
docker compose up -d --build
```

Mêmes URLs : front `3000`, API `4000`.

Sans `infra/.env`, des valeurs par défaut suffisent pour démarrer (JWT / Resend factices, MinIO local). Pour une config réelle :

1. `cp infra/.env.example infra/.env`
2. Renseigner au moins `JWT_SECRET`, et si besoin `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
3. `docker compose up -d --build`

Après un changement de code : `docker compose up -d --build`.

`infra/docker-compose.yaml` sert **uniquement** au local. Staging / prod utilisent `infra/staging/` et `infra/prod/`.

---

## Services locaux

| Service        | URL                         | Identifiants                          |
| -------------- | --------------------------- | ------------------------------------- |
| Front          | http://localhost:3000       | —                                     |
| API            | http://localhost:4000       | health : `/health`, ready : `/ready`  |
| Docs API       | http://localhost:4000/docs  | —                                     |
| PostgreSQL     | `localhost:5432`            | user / pass / db : `nirby`            |
| Redis          | `localhost:6379`            | —                                     |
| MinIO (S3)     | http://localhost:9000       | `nirbyadmin` / `nirbyadmin123`        |
| Console MinIO  | http://localhost:9001       | idem                                  |
| Adminer        | http://localhost:8080       | serveur `db` (si lancé)               |

---

## Base de données

Prisma 7 :

- Schéma : `apps/api/prisma/schema.prisma`
- CLI : `apps/api/prisma.config.ts` — `MIGRATE_DATABASE_URL` ou, à défaut, `DATABASE_URL`
- Runtime : `apps/api/src/db.ts` — toujours `DATABASE_URL`

**En local**, un seul user `nirby` et une seule `DATABASE_URL` suffisent.

**En staging / prod**, deux rôles :

| Variable                | User        | Usage                           |
| ----------------------- | ----------- | ------------------------------- |
| `MIGRATE_DATABASE_URL`  | `nirby`     | migrations Prisma               |
| `DATABASE_URL`          | `nirby_app` | API au runtime (moindre privilège) |

Commandes (depuis `apps/api`) :

```bash
pnpm prisma:migrate     # créer / appliquer une migration (dev)
pnpm prisma:generate    # régénérer le client
pnpm prisma:clean       # reset (détruit les données)
npx prisma studio       # UI des tables
```

---

## Données de démo

```bash
cd apps/api

# Seed léger (places Google si la clé est présente)
pnpm prisma:seed

# Jeu de démo complet (users, listes, POI) — vide les tables concernées
ALLOW_DEMO_SEED=yes pnpm prisma:seed-demo
```

Le mot de passe des comptes de démo se règle avec `DEMO_PASSWORD` (valeur par défaut dans `prisma/seed-demo.ts`).

---

## Scripts utiles

À la **racine** :

| Commande         | Effet                                        |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | API + front en parallèle                     |
| `pnpm build`     | Build de tous les packages                   |
| `pnpm lint`      | Lint                                         |
| `pnpm format`    | Prettier                                     |
| `pnpm test`      | Tests unitaires / intégration (Turbo)        |
| `pnpm test:e2e`  | Playwright                                   |
| `pnpm clean`     | Nettoyer les outputs Turbo                   |

**API** (`apps/api` ou `pnpm -C apps/api …`) :

| Commande                              | Effet              |
| ------------------------------------- | ------------------ |
| `pnpm dev`                            | API seule, hot-reload |
| `pnpm prisma:migrate`                 | Migrations         |
| `pnpm prisma:generate`                | Client Prisma      |
| `pnpm prisma:seed` / `prisma:seed-demo` | Seeds            |
| `pnpm test` / `test:coverage`         | Vitest             |

**Front** (`apps/web`) :

| Commande              | Effet                                                  |
| --------------------- | ------------------------------------------------------ |
| `pnpm dev`            | Next.js seul                                           |
| `pnpm generate:api`   | Client OpenAPI depuis `http://localhost:4000/docs.json` |
| `pnpm test` / `test:coverage` | Vitest                                         |

---

## Tests

La stratégie détaillée est dans [`docs/test-strategy.md`](docs/test-strategy.md).

```bash
# Unitaires + intégration (API + web)
pnpm test

# Couverture
pnpm -C apps/api test:coverage
pnpm -C apps/web test:coverage

# E2E (Playwright) — ports 3000 / 4000 libres, PostGIS + Redis sur nirby_test
pnpm test:e2e
pnpm --filter @nirby/e2e test:e2e:ui
```

CI (PR et push `main` / `staging`) : lint, tests + couverture, e2e, build Docker, health checks, audit `pnpm`, scan OWASP ZAP (non bloquant).

---

## Déploiement

Géré par [.github/workflows/ci-cd.yaml](.github/workflows/ci-cd.yaml). Rien à lancer à la main une fois le VPS et les secrets en place.

| Branche   | Environnement | Effet                                                         |
| --------- | ------------- | ------------------------------------------------------------- |
| `staging` | Staging       | Build images → copie VPS → `infra/staging/docker-compose.yaml` |
| `main`    | Production    | Idem avec `infra/prod/`                                       |

### Pipeline API au deploy

1. Backup PostgreSQL si une migration est pending (`BACKUP_POLICY=always`).
2. `prisma migrate deploy` dans un container éphémère (l’API en cours continue de servir).
3. Bascule sur la nouvelle image (SHA via `DEPLOY_API_SHA`).
4. Health check `/ready` — **rollback auto** si échec.
5. Conservation des **5** dernières images (`KEEP_IMAGES=5`).

### Premier setup VPS

```bash
ssh <user>@<vps>
sudo mkdir -p /opt/nirby/{scripts,backups/prod,backups/staging,prod,prod/db-init,staging,staging/db-init}
sudo chown -R "$USER:$USER" /opt/nirby
```

Ensuite : push sur `staging` ou `main`. La CI copie les scripts, génère `/opt/nirby/<env>/.env` (`sync-env.sh`) et déploie.

Templates manuels : `infra/prod/.env.example`, `infra/staging/.env.example`.

Au **premier** start avec un volume PostgreSQL vide, `infra/<env>/db-init/` crée le rôle `nirby_app`. Sur une base déjà existante : recréer le volume (`docker compose down -v`, perte de données) ou jouer l’équivalent SQL une fois.

### Secrets GitHub (environments `staging` et `production`)

**Secrets**

| Nom                                           | Rôle                         |
| --------------------------------------------- | ---------------------------- |
| `SSH_HOST` / `SSH_USER` / `SSH_PRIVATE_KEY`   | Accès VPS                    |
| `JWT_SECRET`                                  | Auth                         |
| `DB_PASSWORD`                                 | User Postgres `nirby` (migrations) |
| `DB_APP_PASSWORD`                             | User `nirby_app` (API)       |
| `RESEND_API_KEY`                              | Emails                       |
| `GOOGLE_PLACES_API_KEY`                       | Recherche lieux              |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`   | Uploads                      |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`       | Observabilité                |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`             | Carte (build front)          |

**Variables** (non secrètes) : `FRONTEND_URL`, `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL`, IDs de templates Resend.

---

## Rollback et backups

### Depuis GitHub

Actions → workflow **[Rollback](.github/workflows/rollback.yaml)** → choisir l’environnement, le service (`api` / `web` / `both`) et le **SHA** cible.

### Depuis le VPS

```bash
# Version actuellement déployée
cat /opt/nirby/prod/.deployed-api-sha
cat /opt/nirby/prod/.deployed-web-sha

# Rollback API (image déjà présente sur le serveur)
/opt/nirby/scripts/rollback-api.sh prod <SHA>

# Backup / restore
/opt/nirby/scripts/db-backup.sh prod
/opt/nirby/scripts/db-restore.sh prod /opt/nirby/backups/prod/<fichier>.dump
```

Même chose avec `staging` à la place de `prod`.

---

## Structure du repo

```
.
├── apps/
│   ├── api/                 # Express + Prisma
│   │   ├── prisma/          # schéma, migrations, seeds
│   │   └── src/
│   ├── web/                 # Next.js
│   └── e2e/                 # Playwright
├── infra/
│   ├── docker-compose.yaml  # local uniquement
│   ├── staging/             # compose + db-init staging
│   ├── prod/                # compose + db-init prod
│   └── scripts/             # deploy, migrate, backup, rollback
├── docs/                    # vision, RGPD, tests, Prisma
├── .github/workflows/       # ci-cd.yaml, rollback.yaml
└── pnpm-workspace.yaml
```

---

## Documentation

| Doc                                                                      | Sujet                         |
| ------------------------------------------------------------------------ | ----------------------------- |
| [docs/project-overview.md](docs/project-overview.md)                     | Vision produit                |
| [docs/test-strategy.md](docs/test-strategy.md)                           | Pyramide de tests et CI       |
| [docs/email-verification.md](docs/email-verification.md)                 | Vérif email sur les écritures |
| [docs/gdpr-account-deletion.md](docs/gdpr-account-deletion.md)           | Droit à l’effacement          |
| [docs/gdpr-data-export.md](docs/gdpr-data-export.md)                     | Portabilité                   |
| [docs/gdpr-cookies.md](docs/gdpr-cookies.md)                             | Cookies / consentement        |
| [docs/prisma-transactions.md](docs/prisma-transactions.md)               | Transactions Prisma           |
