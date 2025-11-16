# Nirby

Application full-stack avec API Express, PostgreSQL (PostGIS), et Redis.

## Prérequis

- Node.js 20+
- pnpm 10.14+
- Docker & Docker Compose

## Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configuration

Créer un fichier `.env` dans `apps/api/` :

```env
DATABASE_URL="postgresql://nirby:nirby@localhost:5432/nirby"
REDIS_URL="redis://localhost:6379"
PORT=4000
LOG_LEVEL=info
```

## Développement

### Lancer avec Docker (recommandé)

Démarre tous les services (PostgreSQL, Redis, API) :

```bash
cd infra
docker-compose up
```

Pour reconstruire les images :

```bash
docker-compose up --build
```

Pour lancer en arrière-plan :

```bash
docker-compose up -d
```

Voir les logs :

```bash
docker-compose logs -f api
```

Arrêter les services :

```bash
docker-compose down
```

### Lancer en local (développement)

1. Démarrer uniquement la DB et Redis avec Docker :

```bash
cd infra
docker-compose up db redis -d
```

2. Lancer l'API en mode développement :

```bash
cd apps/api
pnpm dev
```

## Services

Une fois démarré, les services sont accessibles sur :

- **API** : http://localhost:4000
  - Health check : http://localhost:4000/health
  - DB Health check : http://localhost:4000/db/health
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379

## Base de données

### Migrations Prisma

Créer une nouvelle migration :

```bash
cd apps/api
pnpm prisma:migrate
```

Générer le client Prisma :

```bash
cd apps/api
pnpm prisma:generate
```

Ouvrir Prisma Studio :

```bash
cd apps/api
npx prisma studio
```

## Structure du projet

```
.
├── apps/
│   └── api/                # API Express
│       ├── prisma/         # Schéma et migrations Prisma
│       ├── src/            # Code source
│       └── Dockerfile      # Image Docker de l'API
├── infra/
│   └── docker-compose.yaml # Configuration Docker
├── packages/               # Packages partagés
└── pnpm-workspace.yaml     # Configuration monorepo
```

## Scripts disponibles

### Root

```bash
pnpm build    # Build tous les packages
pnpm dev      # Lancer en mode développement
pnpm lint     # Linter le code
pnpm test     # Lancer les tests
```

### API (`apps/api`)

```bash
pnpm dev              # Développement avec hot-reload
pnpm build            # Build pour production
pnpm start            # Lancer la version buildée
pnpm prisma:migrate   # Créer une migration
pnpm prisma:generate  # Générer le client Prisma
```

## Technologies

- **API** : Express, TypeScript
- **Base de données** : PostgreSQL avec PostGIS
- **Cache** : Redis
- **ORM** : Prisma
- **Logs** : Pino
- **Package Manager** : pnpm
- **Build** : Turborepo
- **Containerisation** : Docker
