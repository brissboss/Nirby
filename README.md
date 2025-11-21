# Nirby test

Full-stack application with Express API, PostgreSQL (PostGIS), and Redis.

## Prerequisites

- Node.js 20+
- pnpm 10.14+
- Docker & Docker Compose

## Installation

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configuration

Create a `.env` file in `apps/api/`:

```env
DATABASE_URL="postgresql://nirby:nirby@localhost:5432/nirby"
REDIS_URL="redis://localhost:6379"
PORT=4000
LOG_LEVEL=info
```

## Development

### Run with Docker (recommended)

Starts all services (PostgreSQL, Redis, API):

```bash
cd infra
docker-compose up
```

To rebuild images:

```bash
docker-compose up --build
```

To run in background:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f api
```

Stop services:

```bash
docker-compose down
```

### Run locally (development)

1. Start only DB and Redis with Docker:

```bash
cd infra
docker-compose up db redis -d
```

2. Run the API in development mode:

```bash
cd apps/api
pnpm dev
```

## Services

Once started, services are accessible at:

- **API**: http://localhost:4000
  - Health check: http://localhost:4000/health
  - DB Health check: http://localhost:4000/db/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database

### Prisma Migrations

Create a new migration:

```bash
cd apps/api
pnpm prisma:migrate
```

Generate Prisma Client:

```bash
cd apps/api
pnpm prisma:generate
```

Open Prisma Studio:

```bash
cd apps/api
npx prisma studio
```

## Project Structure

```
.
├── apps/
│   └── api/                # Express API
│       ├── prisma/         # Prisma schema and migrations
│       ├── src/            # Source code
│       └── Dockerfile      # API Docker image
├── infra/
│   └── docker-compose.yaml # Docker configuration
├── packages/               # Shared packages
└── pnpm-workspace.yaml     # Monorepo configuration
```

## Available Scripts

### Root

```bash
pnpm build    # Build all packages
pnpm dev      # Run in development mode
pnpm lint     # Lint code
pnpm test     # Run tests
```

### API (`apps/api`)

```bash
pnpm dev              # Development with hot-reload
pnpm build            # Build for production
pnpm start            # Run built version
pnpm prisma:migrate   # Create a migration
pnpm prisma:generate  # Generate Prisma Client
```

## Technologies

- **API**: Express, TypeScript
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **ORM**: Prisma
- **Logging**: Pino
- **Package Manager**: pnpm
- **Build**: Turborepo
- **Containerization**: Docker
