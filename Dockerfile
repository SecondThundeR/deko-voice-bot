FROM oven/bun:debian AS base
WORKDIR /usr/app

# Adding ffmpeg binary for conversion from bot
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install necessary tools for adding new repositories
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg2 lsb-release apt-transport-https ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Add the PostgreSQL PGDG apt repository
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import the PostgreSQL team\'s GPG key
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# Update the apt package list again to include the new repository
RUN apt-get update

# Install the PostgreSQL 16 client packages specifically
RUN apt-get install -y postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/app/drizzle drizzle
COPY --from=prerelease /usr/app/src src
COPY --from=prerelease /usr/app/locales locales
COPY --from=prerelease /usr/app/bot.ts .
COPY --from=prerelease /usr/app/package.json .
# if .env file exists, container will use it. otherwise, user should setup variables manually
COPY --from=prerelease /usr/app/*.env .
COPY --from=prerelease /usr/app/tsconfig.json .

ENTRYPOINT ["bun", "start"]
