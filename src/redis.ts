import { Redis } from "ioredis";

import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { getSafeErrorInfo } from "./logging.ts";

export const redis = config.redisUrl
    ? new Redis(config.redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 3,
      })
    : null;

redis?.on("error", (error: unknown) => {
    logger.error({
        msg: "Redis client error",
        ...getSafeErrorInfo(error),
    });
});

export async function checkRedisConnection() {
    if (!redis) {
        return false;
    }
    if (redis.status === "wait") {
        await redis.connect();
    }
    await redis.ping();
    return true;
}

export async function closeRedisConnection() {
    if (!redis) {
        return;
    }
    if (redis.status === "end") {
        return;
    }
    if (redis.status === "wait") {
        redis.disconnect();
        return;
    }

    try {
        await redis.quit();
    } catch {
        redis.disconnect();
    }
}
