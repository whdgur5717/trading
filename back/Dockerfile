FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY back/package.json ./back/package.json

RUN pnpm install --frozen-lockfile --filter back...

FROM deps AS build

COPY back ./back

RUN pnpm --filter back build

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY back/package.json ./back/package.json

RUN pnpm install --prod --frozen-lockfile --filter back...

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

WORKDIR /app/back

COPY --from=prod-deps --chown=node:node /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=node:node /app/back/node_modules /app/back/node_modules
COPY --from=build --chown=node:node /app/back/dist ./dist
COPY --from=build --chown=node:node /app/back/package.json ./package.json

USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]
