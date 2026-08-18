import {
    loadEnvironmentFile,
    logLevelSchema,
    parseEnvironment,
} from "@deko-voice-bot/config";
import * as v from "valibot";

const schema = v.object({
    leaseMs: v.optional(
        v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)),
        "60000",
    ),
    logFormat: v.optional(v.picklist(["pretty", "json"]), "pretty"),
    logLevel: logLevelSchema,
    pollIntervalMs: v.optional(
        v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)),
        "1000",
    ),
});

loadEnvironmentFile();

export const config = parseEnvironment(schema, {
    leaseMs: process.env.WORKER_LEASE_MS,
    logFormat: process.env.LOG_FORMAT,
    logLevel: process.env.LOG_LEVEL,
    pollIntervalMs: process.env.WORKER_POLL_INTERVAL_MS,
});
