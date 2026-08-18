FROM node:24.19.0-slim AS base
WORKDIR /repo
ENV PNPM_HOME="/pnpm" COREPACK_HOME="/pnpm/corepack" PATH="/pnpm:$PATH"
RUN corepack enable
COPY package.json ./
RUN corepack prepare --activate && chmod -R a+rX "$COREPACK_HOME"

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/bot/package.json apps/bot/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/application/package.json packages/application/
COPY packages/audio/package.json packages/audio/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/metrics/package.json packages/metrics/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @deko-voice-bot/bot build

FROM base AS release
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && mkdir -p /usr/share/keyrings \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /usr/share/keyrings/postgres.gpg \
    && . /etc/os-release \
    && echo "deb [signed-by=/usr/share/keyrings/postgres.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-18 \
    && apt-get purge -y --auto-remove curl gnupg \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /repo/node_modules /repo/node_modules
COPY --from=build --chown=node:node /repo/apps/bot/node_modules /repo/apps/bot/node_modules
COPY --from=build --chown=node:node /repo/apps/bot/dist /repo/apps/bot/dist
COPY --from=build --chown=node:node /repo/apps/bot/locales /repo/apps/bot/locales
COPY --from=build --chown=node:node /repo/apps/bot/package.json /repo/apps/bot/package.json
COPY --from=build --chown=node:node /repo/packages /repo/packages
WORKDIR /repo/apps/bot
USER node
ENTRYPOINT ["node", "./dist/main.mjs"]
