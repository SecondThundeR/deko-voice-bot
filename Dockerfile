FROM oven/bun:1.3.12-slim AS base
WORKDIR /usr/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
    gnupg \
    && mkdir -p /usr/share/keyrings \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
      | gpg --dearmor -o /usr/share/keyrings/postgres.gpg \
    && . /etc/os-release \
    && echo "deb [signed-by=/usr/share/keyrings/postgres.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-18 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
RUN cp -R node_modules /tmp/node_modules_dev
RUN rm -rf node_modules && bun install --frozen-lockfile --production

FROM base AS release
ENV NODE_ENV=production

COPY --from=install /usr/app/node_modules ./node_modules
COPY drizzle ./drizzle
COPY src ./src
COPY locales ./locales
COPY package.json .
COPY tsconfig.json .

RUN chown -R bun:bun /usr/app
USER bun
ENTRYPOINT ["bun", "start"]
