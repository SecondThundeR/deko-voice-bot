FROM oven/bun:debian AS base
WORKDIR /usr/app

# Adding ffmpeg binary for conversion from bot
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get -y --no-install-recommends install \
        ffmpeg

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/app/src src
COPY --from=prerelease /usr/app/locales locales
COPY --from=prerelease /usr/app/bot.ts .
COPY --from=prerelease /usr/app/package.json .
# if .env file exists, container will use it. otherwise, user should setup variables manually
COPY --from=prerelease /usr/app/*.env .
COPY --from=prerelease /usr/app/tsconfig.json .

ENTRYPOINT ["bun", "start"]
