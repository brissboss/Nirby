FROM node:20-alpine AS base
WORKDIR /app

# Dependencies only (faster rebuilds)
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Sources
COPY tsconfig.json ./
COPY src ./src

# Build
RUN pnpm build

# Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]