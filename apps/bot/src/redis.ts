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

export async function clearBotSessionState() {
    if (!redis) return;
    for (const prefix of ["session:", "conversation:"]) {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                "MATCH",
                `${prefix}*`,
                "COUNT",
                100,
            );
            cursor = nextCursor;
            if (keys.length > 0) await redis.unlink(...keys);
        } while (cursor !== "0");
    }
}

export async function consumeInlineQueryToken(userId: number) {
    if (!redis) return true;
    const capacity = 30;
    const refillPerSecond = 3;
    const now = Date.now();
    const result = await redis.eval(
        `local data = redis.call('HMGET', KEYS[1], 'tokens', 'updated')
         local tokens = tonumber(data[1]) or tonumber(ARGV[1])
         local updated = tonumber(data[2]) or tonumber(ARGV[3])
         tokens = math.min(tonumber(ARGV[1]), tokens + (tonumber(ARGV[3]) - updated) / 1000 * tonumber(ARGV[2]))
         local allowed = tokens >= 1
         if allowed then tokens = tokens - 1 end
         redis.call('HMSET', KEYS[1], 'tokens', tokens, 'updated', ARGV[3])
         redis.call('PEXPIRE', KEYS[1], 20000)
         return allowed and 1 or 0`,
        1,
        `inline-rate:${userId}`,
        capacity,
        refillPerSecond,
        now,
    );
    return result === 1;
}
