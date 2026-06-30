# AGENTS.md

## Cursor Cloud specific instructions

This is the **Nirby** monorepo (pnpm + Turborepo): `apps/api` (Express + Prisma 7) and `apps/web`
(Next.js 16). Standard commands live in `README.md` and the `package.json` scripts; only the
non-obvious, cloud-specific caveats are captured here.

### Services and how they run

Dev mode = run the apps with `pnpm dev` (turbo runs both); supporting infra (Postgres, Redis,
MinIO) runs natively on this VM (Docker is **not** installed here, unlike the README's Docker flow).

| Service                 | Port        | Start command (services are NOT auto-started on VM boot)                                                                |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| API (Express)           | 4000        | `pnpm --filter @nirby/api dev` (or root `pnpm dev`)                                                                     |
| Web (Next.js)           | 3000        | `pnpm --filter @nirby/web dev` (or root `pnpm dev`)                                                                     |
| PostgreSQL 16 + PostGIS | 5432        | `sudo pg_ctlcluster 16 main start`                                                                                      |
| Redis 7                 | 6379        | `sudo redis-server --daemonize yes`                                                                                     |
| MinIO (S3, optional)    | 9000 / 9001 | `MINIO_ROOT_USER=nirbyadmin MINIO_ROOT_PASSWORD=nirbyadmin123 minio server /tmp/minio-data --console-address ':9001' &` |

The update script only refreshes code dependencies (it does **not** start services). At the start
of a session, start Postgres/Redis (and MinIO if testing uploads) with the commands above.

- DB role/credentials: `nirby` / `nirby`, databases `nirby` (dev) and `nirby_test` (vitest). PostGIS
  is required and is created by the Prisma migrations themselves — do **not** `CREATE EXTENSION
postgis` manually, or `prisma migrate dev` will report schema drift.
- Redis is optional: if unreachable the API falls back to in-memory rate limiting.
- MinIO is optional: only needed for file uploads. Without it `/ready` reports `storage: ok=false`
  but the rest of the app works. After starting MinIO, create the bucket once:
  `mc alias set myminio http://localhost:9000 nirbyadmin nirbyadmin123 && mc mb -p myminio/nirby-uploads-dev && mc anonymous set download myminio/nirby-uploads-dev`

### API env (`apps/api/.env`)

`pnpm dev` for the API requires `apps/api/.env` (copy from `.env.example`). Gotchas not obvious from
the example file:

- `JWT_SECRET` must be >= 32 chars and `RESEND_API_KEY` must start with `re_` or the API refuses to
  boot (`src/env.ts`). A placeholder `re_...` is fine; real emails just won't send.
- `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` must be **numeric seconds**. `.env.example` shows
  `ACCESS_TOKEN_TTL="15m"`, which fails the Zod schema (`z.coerce.number()`) — use `900` / `604800`
  or omit them to take the defaults.

### Web env (`apps/web/.env.local`, optional but recommended)

The authenticated map/home view crashes ("Something went wrong") when
`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is unset. Create `apps/web/.env.local` with a token (a placeholder
like `pk.test123456789` is enough to stop the crash and exercise lists/POIs; a real Mapbox token is
needed for actual map tiles). `NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000`. Restart the
web dev server after creating this file. `.env.local` is gitignored.

### Database setup / migrations

- Apply migrations with `pnpm --filter @nirby/api exec prisma migrate deploy` (non-destructive).
  Avoid `prisma migrate reset` / `prisma migrate dev` resets — Prisma 7 blocks them when invoked by
  an AI agent (requires explicit user consent), and `migrate deploy` is enough for a fresh DB.
- The `nirby_test` DB used by `apps/api` vitest is **not** auto-created. Create + migrate it once:
  `sudo -u postgres createdb -O nirby nirby_test` then
  `DATABASE_URL=postgresql://nirby:nirby@localhost:5432/nirby_test pnpm --filter @nirby/api exec prisma migrate deploy`.
- Seeding: the `prisma:seed` script (`tsx prisma/seed.ts`) does not load `.env`; run it with dotenv
  preloaded: `pnpm --filter @nirby/api exec tsx -r dotenv/config prisma/seed.ts`. Seed test accounts:
  `theobrissiaud@icloud.com`, `alice@test.com`, `bob@test.com` (all password `password123`).

### Native dependencies

`pnpm.onlyBuiltDependencies` in the root `package.json` whitelists native build scripts (bcrypt,
prisma engines, esbuild, sharp, swc, etc.) so `pnpm install` builds them non-interactively. If those
binaries are ever missing, run `pnpm rebuild bcrypt esbuild prisma @prisma/engines sharp @swc/core`.
