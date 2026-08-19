FROM node:24.19.0-slim AS base
WORKDIR /usr/src/app
ENV PNPM_HOME="/pnpm"
ENV COREPACK_HOME="/pnpm/corepack"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json ./
RUN corepack prepare --activate && chmod -R a+rX "$COREPACK_HOME"

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json apps/bot/package.json
COPY apps/operations/package.json apps/operations/package.json
COPY packages/backup/package.json packages/backup/package.json
COPY packages/operations-contract/package.json packages/operations-contract/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @deko-voice-bot/bot build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json apps/bot/package.json
COPY apps/operations/package.json apps/operations/package.json
COPY packages/backup/package.json packages/backup/package.json
COPY packages/operations-contract/package.json packages/operations-contract/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile

FROM base AS release
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /usr/src/app/node_modules node_modules
COPY --from=prod-deps --chown=node:node /usr/src/app/apps/bot/node_modules apps/bot/node_modules
COPY --from=build --chown=node:node /usr/src/app/apps/bot/dist apps/bot/dist
COPY --from=build --chown=node:node /usr/src/app/apps/bot/drizzle apps/bot/drizzle
COPY --from=build --chown=node:node /usr/src/app/apps/bot/locales apps/bot/locales
COPY --from=build --chown=node:node /usr/src/app/apps/bot/package.json apps/bot/package.json
COPY --from=build --chown=node:node /usr/src/app/packages/shared packages/shared
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN chown node:node /usr/src/app

USER node
ENTRYPOINT ["node", "./apps/bot/dist/main.mjs"]
