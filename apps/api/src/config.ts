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
});

loadEnvironmentFile();

export const config = parseEnvironment(schema, {
    adminIds: process.env.ADMIN_IDS,
    botToken: process.env.BOT_TOKEN,
    logFormat: process.env.LOG_FORMAT,
    logLevel: process.env.LOG_LEVEL,
    moderationChatId: process.env.VOICE_MODERATION_CHAT_ID,
    port: process.env.PORT,
});
