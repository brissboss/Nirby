FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install all deps
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

# Prod deps
FROM base AS prod-deps
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm -C apps/api exec prisma generate

# Runtime - garde la structure monorepo
FROM node:20-alpine AS runtime
WORKDIR /repo/apps/api
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copie toute la structure pnpm
COPY --from=prod-deps /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml /repo/
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/api/package.json ./package.json
COPY --from=prod-deps /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]