FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Deps layer (cache-friendly)
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY apps/api ./apps/api
COPY turbo.json ./
RUN pnpm -C apps/api prisma:generate
RUN pnpm -C apps/api build

# Deploy (prod bundle sans husky)
FROM base AS deploy
WORKDIR /repo
ENV CI=true
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm -C apps/api exec prisma generate
RUN pnpm deploy --filter=@nirby/api --prod --legacy /out

# Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy /out .
EXPOSE 4000
CMD ["node", "dist/index.js"]