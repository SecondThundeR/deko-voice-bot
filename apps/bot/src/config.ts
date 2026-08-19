import { loadEnvironmentFile } from "@deko-voice-bot/shared";
import * as v from "valibot";

const baseConfigSchema = v.object({
    nodeEnv: v.optional(
        v.picklist(["development", "production"]),
        "development",
    ),
    useDebug: v.optional(
        v.pipe(v.string(), v.parseJson(), v.boolean()),
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
    logFormat: v.optional(v.picklist(["pretty", "json"])),
    logColorize: v.optional(v.pipe(v.string(), v.parseJson(), v.boolean())),
    botToken: v.pipe(v.string(), v.regex(/^\d+:[\w-]+$/, "Invalid token")),
    adminIds: v.optional(
        v.pipe(
            v.string(),
            v.parseJson(),
            v.array(v.pipe(v.number(), v.safeInteger(), v.minValue(1))),
        ),
        "[]",
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
    operationsToken: v.pipe(v.string(), v.minLength(24)),
    operationsUrl: v.pipe(v.string(), v.url()),
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
    v.transform(({ logFormat, useDebug, ...input }) => ({
        ...input,
        isDebug: useDebug,
        logFormat:
            logFormat ?? (input.nodeEnv === "production" ? "json" : "pretty"),
    })),
);

export type Config = v.InferOutput<typeof configSchema>;
export type PollingConfig = Extract<Config, { botMode: "polling" }>;
export type WebhookConfig = Extract<Config, { botMode: "webhook" }>;

export function createConfig(input: unknown) {
    return v.parse(configSchema, input);
}

type Environment = Record<string, string | undefined>;

const CONFIG_KEY_TO_ENVIRONMENT_VARIABLE = {
    adminIds: "ADMIN_IDS",
    backupMaxSizeMb: "BACKUP_MAX_SIZE_MB",
    botMode: "BOT_MODE",
    botToken: "BOT_TOKEN",
    botWebhook: "BOT_WEBHOOK",
    botWebhookSecret: "BOT_WEBHOOK_SECRET",
    importSessionTtlMinutes: "IMPORT_SESSION_TTL_MINUTES",
    logColorize: "LOG_COLORIZE",
    logFormat: "LOG_FORMAT",
    logLevel: "LOG_LEVEL",
    nodeEnv: "NODE_ENV",
    operationsToken: "OPERATIONS_TOKEN",
    operationsUrl: "OPERATIONS_URL",
    serverHost: "SERVER_HOST",
    serverPort: "SERVER_PORT",
    useDebug: "USE_DEBUG",
} as const;

function getInvalidEnvironmentVariables(error: unknown) {
    if (!v.isValiError(error)) return [];

    const variables = new Set<string>();
    for (const issue of error.issues) {
        const configKey = issue.path?.find(
            (item) => item.type === "object" && typeof item.key === "string",
        )?.key;
        if (typeof configKey !== "string") continue;

        const variable =
            CONFIG_KEY_TO_ENVIRONMENT_VARIABLE[
                configKey as keyof typeof CONFIG_KEY_TO_ENVIRONMENT_VARIABLE
            ];
        if (variable) variables.add(variable);
    }
    return [...variables];
}

export function createConfigFromEnvironment(environment: Environment) {
    try {
        return createConfig({
            adminIds: environment.ADMIN_IDS,
            backupMaxSizeMb: environment.BACKUP_MAX_SIZE_MB,
            botMode: environment.BOT_MODE,
            botToken: environment.BOT_TOKEN,
            botWebhook: environment.BOT_WEBHOOK,
            botWebhookSecret: environment.BOT_WEBHOOK_SECRET,
            importSessionTtlMinutes: environment.IMPORT_SESSION_TTL_MINUTES,
            logColorize: environment.LOG_COLORIZE,
            logFormat: environment.LOG_FORMAT,
            logLevel: environment.LOG_LEVEL,
            nodeEnv: environment.NODE_ENV,
            operationsToken: environment.OPERATIONS_TOKEN,
            operationsUrl: environment.OPERATIONS_URL,
            serverHost: environment.SERVER_HOST,
            serverPort: environment.SERVER_PORT,
            useDebug: environment.USE_DEBUG,
        });
    } catch (error) {
        const invalidVariables = getInvalidEnvironmentVariables(error);
        const suffix =
            invalidVariables.length > 0
                ? `: ${invalidVariables.join(", ")}`
                : "";
        throw new Error(`Invalid application configuration${suffix}`);
    }
}

loadEnvironmentFile();
export const config = createConfigFromEnvironment(process.env);
