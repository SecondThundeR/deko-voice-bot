import { randomUUID } from "node:crypto";
import { getFFMPEGStatus } from "@deko-voice-bot/audio";
import { checkDatabaseConnection } from "@deko-voice-bot/database/db.js";
import * as stats from "@deko-voice-bot/database/queries/stats.js";
import * as submissions from "@deko-voice-bot/database/queries/submissions.js";
import * as users from "@deko-voice-bot/database/queries/users.js";
import * as favorites from "@deko-voice-bot/database/queries/users-favorites.js";
import * as voices from "@deko-voice-bot/database/queries/voices.js";
import { withDatabaseTraffic } from "@deko-voice-bot/database/traffic.js";
import { Redis } from "ioredis";
import * as audio from "./audio.ts";
import { telegramAuth } from "./auth.ts";
import { config } from "./config.ts";
import type { ApiDependencies } from "./dependencies.ts";
import { logger } from "./logger.ts";
import { InMemoryRateLimiter, RedisRateLimiter } from "./rate-limit.ts";
import * as telegram from "./telegram.ts";

let draining = false;
const redis =
    config.rateLimitBackend === "redis"
        ? new Redis(config.redisUrl, {
              lazyConnect: true,
              maxRetriesPerRequest: 1,
          })
        : null;
if (config.rateLimitBackend === "redis" && !config.redisUrl)
    throw new Error("REDIS_URL is required when API_RATE_LIMIT_BACKEND=redis");
const rateLimiter = redis
    ? new RedisRateLimiter(redis)
    : new InMemoryRateLimiter();

export const runtimeDependencies: ApiDependencies = {
    database: withDatabaseTraffic,
    corsOrigins: config.corsOrigins,
    rateLimiter,
    readiness: {
        setDraining(value) {
            draining = value;
        },
        async isReady() {
            return (
                !draining &&
                (await checkDatabaseConnection().then(
                    () => true,
                    () => false,
                )) &&
                (await getFFMPEGStatus())
            );
        },
    },
    logger,
    telegramAuth,
    randomUUID,
    ...audio,
    ...telegram,
    ...submissions,
    ...stats,
    ...users,
    ...favorites,
    ...voices,
};
