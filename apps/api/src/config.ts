import {
    loadEnvironmentFile,
    logLevelSchema,
    parseEnvironment,
} from "@deko-voice-bot/config";
import * as v from "valibot";

const schema = v.object({
    botToken: v.pipe(v.string(), v.regex(/^\d+:[\w-]+$/, "Invalid token")),
    adminIds: v.optional(
        v.pipe(
            v.string(),
            v.transform(JSON.parse),
            v.array(v.pipe(v.number(), v.safeInteger(), v.minValue(1))),
        ),
        "[]",
    ),
    moderationChatId: v.pipe(v.string(), v.transform(Number), v.safeInteger()),
    port: v.optional(
        v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)),
        "3000",
    ),
    logLevel: logLevelSchema,
    logFormat: v.optional(v.picklist(["pretty", "json"]), "pretty"),
    corsOrigins: v.optional(
        v.pipe(
            v.string(),
            v.transform((value) =>
                value
                    .split(",")
                    .map((origin) => origin.trim())
                    .filter(Boolean),
            ),
            v.array(
                v.pipe(
                    v.string(),
                    v.regex(/^https?:\/\/[^/]+$/i, "Invalid CORS origin"),
                ),
            ),
        ),
        "",
    ),
    rateLimitBackend: v.optional(v.picklist(["memory", "redis"]), "memory"),
    redisUrl: v.optional(
        v.union([v.pipe(v.string(), v.url()), v.literal("")]),
        "",
    ),
});

loadEnvironmentFile();

export const config = parseEnvironment(schema, {
    adminIds: process.env.ADMIN_IDS,
    botToken: process.env.BOT_TOKEN,
    logFormat: process.env.LOG_FORMAT,
    corsOrigins: process.env.API_CORS_ORIGINS,
    rateLimitBackend: process.env.API_RATE_LIMIT_BACKEND,
    redisUrl: process.env.REDIS_URL,
    logLevel: process.env.LOG_LEVEL,
    moderationChatId: process.env.VOICE_MODERATION_CHAT_ID,
    port: process.env.PORT,
});
