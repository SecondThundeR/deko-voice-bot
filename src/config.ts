import { API_CONSTANTS } from "grammy";
import * as v from "valibot";

const baseConfigSchema = v.object({
    nodeEnv: v.optional(
        v.picklist(["development", "production"]),
        "development",
    ),
    useDebug: v.optional(
        v.pipe(v.string(), v.transform(JSON.parse), v.boolean()),
        "false",
    ),
    logLevel: v.optional(
        v.pipe(
            v.string(),
            v.picklist([
                "trace",
                "debug",
                "info",
                "warn",
                "error",
                "fatal",
                "silent",
            ]),
        ),
        "info",
    ),
    logFormat: v.optional(v.picklist(["pretty", "json"]), "pretty"),
    logColorize: v.optional(
        v.pipe(v.string(), v.transform(JSON.parse), v.boolean()),
    ),
    botToken: v.pipe(v.string(), v.regex(/^\d+:[\w-]+$/, "Invalid token")),
    botAllowedUpdates: v.optional(
        v.pipe(
            v.string(),
            v.transform(JSON.parse),
            v.array(v.picklist(API_CONSTANTS.ALL_UPDATE_TYPES)),
        ),
        "[]",
    ),
    adminIds: v.optional(
        v.pipe(
            v.string(),
            v.transform(JSON.parse),
            v.array(v.pipe(v.number(), v.safeInteger(), v.minValue(1))),
        ),
        "[]",
    ),
    redisUrl: v.optional(
        v.pipe(
            v.string(),
            v.url(),
            v.check(
                (value) =>
                    ["redis:", "rediss:"].includes(new URL(value).protocol),
                "Must use the redis:// or rediss:// protocol",
            ),
        ),
    ),
    backupEncryptionKey: v.pipe(
        v.string(),
        v.regex(/^[A-Za-z0-9+/]{43}=$/, "Must be 32 bytes encoded as base64"),
    ),
    backupMaxSizeMb: v.optional(
        v.pipe(
            v.string(),
            v.transform(Number),
            v.integer(),
            v.minValue(1),
            v.maxValue(2_000),
        ),
        "50",
    ),
    importSessionTtlMinutes: v.optional(
        v.pipe(
            v.string(),
            v.transform(Number),
            v.integer(),
            v.minValue(1),
            v.maxValue(60),
        ),
        "5",
    ),
});

const rawConfigSchema = v.variant("botMode", [
    v.object({
        botMode: v.literal("polling"),
        ...baseConfigSchema.entries,
    }),
    v.object({
        botMode: v.literal("webhook"),
        ...baseConfigSchema.entries,
        botWebhook: v.pipe(v.string(), v.url()),
        botWebhookSecret: v.pipe(v.string(), v.minLength(12)),
        serverHost: v.optional(v.string(), "0.0.0.0"),
        serverPort: v.optional(
            v.pipe(
                v.string(),
                v.transform(Number),
                v.number(),
                v.safeInteger(),
                v.minValue(1),
                v.maxValue(65_535),
            ),
            "80",
        ),
    }),
]);

const configSchema = v.pipe(
    rawConfigSchema,
    v.forward(
        v.check(
            (input) => input.nodeEnv !== "production" || !!input.redisUrl,
            "REDIS_URL is required in production",
        ),
        ["redisUrl"],
    ),
    v.transform(({ useDebug, ...input }) => ({
        ...input,
        isDebug: useDebug,
    })),
);

export type Config = v.InferOutput<typeof configSchema>;
export type PollingConfig = Extract<Config, { botMode: "polling" }>;
export type WebhookConfig = Extract<Config, { botMode: "webhook" }>;

export function createConfig(input: unknown) {
    return v.parse(configSchema, input);
}

export const config = createConfigFromEnvironment();

function createConfigFromEnvironment() {
    try {
        process.loadEnvFile();
    } catch {
        // No .env file found
    }

    try {
        return createConfig({
            adminIds: process.env.ADMIN_IDS,
            backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
            backupMaxSizeMb: process.env.BACKUP_MAX_SIZE_MB,
            botAllowedUpdates: process.env.BOT_ALLOWED_UPDATES,
            botMode: process.env.BOT_MODE,
            botToken: process.env.BOT_TOKEN,
            botWebhook: process.env.BOT_WEBHOOK,
            botWebhookSecret: process.env.BOT_WEBHOOK_SECRET,
            importSessionTtlMinutes: process.env.IMPORT_SESSION_TTL_MINUTES,
            logColorize: process.env.LOG_COLORIZE,
            logFormat: process.env.LOG_FORMAT,
            logLevel: process.env.LOG_LEVEL,
            nodeEnv: process.env.NODE_ENV,
            redisUrl: process.env.REDIS_URL,
            serverHost: process.env.SERVER_HOST,
            serverPort: process.env.SERVER_PORT,
            useDebug: process.env.USE_DEBUG,
        });
    } catch (error) {
        throw new Error("Invalid config", {
            cause: error,
        });
    }
}
