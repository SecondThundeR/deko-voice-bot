FROM node:24.19.0-slim AS base
WORKDIR /repo
ENV PNPM_HOME="/pnpm" COREPACK_HOME="/pnpm/corepack" PATH="/pnpm:$PATH"
RUN corepack enable
COPY package.json ./
RUN corepack prepare --activate && chmod -R a+rX "$COREPACK_HOME"

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/bot/package.json apps/bot/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/audio/package.json packages/audio/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @deko-voice-bot/worker build

FROM base AS release
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo/node_modules /repo/node_modules
COPY --from=build --chown=node:node /repo/apps/worker/node_modules /repo/apps/worker/node_modules
COPY --from=build --chown=node:node /repo/apps/worker/dist /repo/apps/worker/dist
COPY --from=build --chown=node:node /repo/apps/worker/package.json /repo/apps/worker/package.json
COPY --from=build --chown=node:node /repo/packages /repo/packages
WORKDIR /repo/apps/worker
USER node
ENTRYPOINT ["node", "./dist/index.mjs"]
