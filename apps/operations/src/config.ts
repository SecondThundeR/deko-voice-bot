import { loadEnvironmentFile } from "@deko-voice-bot/shared";
import * as v from "valibot";

const configSchema = v.object({
    backupEncryptionKey: v.pipe(
        v.string(),
        v.regex(/^[A-Za-z0-9+/]{43}=$/, "Must be 32 bytes encoded as base64"),
    ),
    backupMaxSizeMb: v.optional(
        v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)),
        "50",
    ),
    databaseUrl: v.pipe(v.string(), v.url()),
    host: v.optional(v.string(), "0.0.0.0"),
    importTtlMinutes: v.optional(
        v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)),
        "15",
    ),
    port: v.optional(
        v.pipe(
            v.string(),
            v.transform(Number),
            v.integer(),
            v.minValue(1),
            v.maxValue(65_535),
        ),
        "3003",
    ),
    serviceToken: v.pipe(v.string(), v.minLength(24)),
    voiceMaxSizeMb: v.optional(
        v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)),
        "25",
    ),
});

loadEnvironmentFile();

export const config = (() => {
    try {
        return v.parse(configSchema, {
            backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
            backupMaxSizeMb: process.env.BACKUP_MAX_SIZE_MB,
            databaseUrl: process.env.DATABASE_URL,
            host: process.env.OPERATIONS_HOST,
            importTtlMinutes: process.env.OPERATIONS_IMPORT_TTL_MINUTES,
            port: process.env.OPERATIONS_PORT,
            serviceToken: process.env.OPERATIONS_TOKEN,
            voiceMaxSizeMb: process.env.OPERATIONS_VOICE_MAX_SIZE_MB,
        });
    } catch {
        throw new Error("Invalid operations service configuration");
    }
})();
