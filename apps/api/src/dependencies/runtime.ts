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
import { telegramAuth } from "../auth.ts";
import { config } from "../config/index.ts";
import * as audio from "../integrations/audio.ts";
import * as telegram from "../integrations/telegram.ts";
import { logger } from "../observability/logger.ts";
import { createApiMetrics } from "../observability/metrics.ts";
import { InMemoryRateLimiter, RedisRateLimiter } from "../rate-limit.ts";
import type { ApiDependencies } from "./types.ts";

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

const metricsToken =
    config.metricsEnabled && config.metricsToken.length >= 32
        ? config.metricsToken
        : undefined;
if (config.metricsEnabled && !metricsToken)
    logger.warn(
        {},
        "API metrics disabled: API_METRICS_TOKEN must contain at least 32 characters",
    );

export const runtimeDependencies: ApiDependencies = {
    database: withDatabaseTraffic,
    corsOrigins: config.corsOrigins,
    metrics: createApiMetrics(),
    metricsToken,
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
