FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY front/package.json ./front/package.json

RUN pnpm install --frozen-lockfile --filter front...

FROM deps AS build

COPY front ./front

RUN pnpm --filter front build

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

WORKDIR /app/front

COPY --from=build --chown=node:node /app/front/.next/standalone ./
COPY --from=build --chown=node:node /app/front/.next/static ./front/.next/static
COPY --from=build --chown=node:node /app/front/public ./front/public

USER node

EXPOSE 8080

CMD ["node", "front/server.js"]
