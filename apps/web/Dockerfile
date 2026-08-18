FROM node:24.19.0-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/bot/package.json apps/bot/
COPY apps/web/package.json apps/web/
COPY packages/application/package.json packages/application/
COPY packages/audio/package.json packages/audio/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/metrics/package.json packages/metrics/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile --filter @deko-voice-bot/web...
COPY . .
RUN pnpm --filter @deko-voice-bot/web build

FROM nginx:1.29-alpine-slim AS release
RUN apk add --no-cache gettext
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=3001 API_URL=http://api:3000
EXPOSE 3001
CMD ["/bin/sh", "-c", "envsubst '$PORT $API_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
