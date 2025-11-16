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
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY turbo.json ./
WORKDIR /repo/apps/api
RUN pnpm prisma:generate
RUN pnpm build

# Runtime dependencies
FROM base AS runtime-deps
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile --prod
WORKDIR /repo/apps/api
RUN pnpm prisma:generate

# Runtime
FROM base
WORKDIR /repo
ENV NODE_ENV=production
COPY pnpm-workspace.yaml package.json ./
COPY --from=runtime-deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=runtime-deps /repo/apps/api/prisma ./apps/api/prisma
COPY --from=runtime-deps /repo/apps/api/node_modules ./apps/api/node_modules
WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]