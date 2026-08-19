FROM node:24.19.0-slim AS base
WORKDIR /usr/src/app
ENV PNPM_HOME="/pnpm"
ENV COREPACK_HOME="/pnpm/corepack"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json ./
RUN corepack prepare --activate && chmod -R a+rX "$COREPACK_HOME"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
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

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json apps/bot/package.json
COPY apps/operations/package.json apps/operations/package.json
COPY packages/backup/package.json packages/backup/package.json
COPY packages/operations-contract/package.json packages/operations-contract/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @deko-voice-bot/operations build

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
COPY --from=mwader/static-ffmpeg:8.1.2 /ffmpeg /usr/local/bin/
COPY --from=prod-deps --chown=node:node /usr/src/app/node_modules node_modules
COPY --from=prod-deps --chown=node:node /usr/src/app/apps/operations/node_modules apps/operations/node_modules
COPY --from=build --chown=node:node /usr/src/app/apps/operations/dist apps/operations/dist
COPY --from=build --chown=node:node /usr/src/app/apps/operations/package.json apps/operations/package.json
RUN chown node:node /usr/src/app

USER node
ENTRYPOINT ["node", "./apps/operations/dist/main.mjs"]
