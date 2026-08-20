import {
    BackupOperationBusyError,
    createBackupTempPaths,
    createDatedBackupFileName,
    createEncryptedDatabaseBackup,
    normalizeRestoredDatabase,
    parseBackupEncryptionKey,
    removeBackupTempPaths,
    restoreDatabaseDump,
    validateRestoredDatabase,
    withBackupAdvisoryLock,
} from "@deko-voice-bot/backup";
import { API_ROUTES } from "@deko-voice-bot/contract";
import { getSafeErrorInfo } from "@deko-voice-bot/shared";
import { Hono } from "hono";
import { pino } from "pino";
import {
    convertMP3ToOggOpus,
    createAudioTempPaths,
    removeAudioTempPaths,
} from "./audio.ts";
import { bearerAuth } from "./auth.ts";
import type { config as applicationConfig } from "./config.ts";
import {
    createFileResponse,
    FileSizeLimitError,
    writeRequestBodyToPath,
} from "./files.ts";
import { ImportStore } from "./import-store.ts";

type Config = typeof applicationConfig;
const OPERATION_ID_PATTERN = /^[0-9a-f-]{36}$/;

export function createApiServer(
    config: Config,
    options: { ffmpegAvailable: boolean },
) {
    const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
    const encryptionKey = parseBackupEncryptionKey(config.backupEncryptionKey);
    const importStore = new ImportStore(
        encryptionKey,
        config.backupMaxSizeMb * 1024 * 1024,
        config.importTtlMinutes * 60 * 1_000,
    );
    let restoringDatabase = false;

    const server = new Hono();
    server.get("/", (c) => c.json({ status: true }));
    server.use("/*", bearerAuth(config.serviceToken));

    server.get(API_ROUTES.health, (c) =>
        c.json({
            ffmpegAvailable: options.ffmpegAvailable,
            restoringDatabase,
            status: true as const,
        }),
    );

    server.post(API_ROUTES.voiceConvert, async (c) => {
        if (!options.ffmpegAvailable) {
            return c.json({ error: "FFmpeg is unavailable" }, 503);
        }

        const paths = await createAudioTempPaths();
        try {
            await writeRequestBodyToPath(
                c.req.raw,
                paths.input,
                config.voiceMaxSizeMb * 1024 * 1024,
            );
            await convertMP3ToOggOpus(paths.input, paths.output);
            return createFileResponse(paths.output, "voice.ogg", {
                contentType: "audio/ogg",
                onClose: () => removeAudioTempPaths(paths),
            });
        } catch (error) {
            await removeAudioTempPaths(paths);
            throw error;
        }
    });

    server.post(API_ROUTES.exportDatabase, async () => {
        const paths = await createBackupTempPaths("api-export");
        try {
            const sha256 = await withBackupAdvisoryLock(
                config.databaseUrl,
                () =>
                    createEncryptedDatabaseBackup({
                        databaseUrl: config.databaseUrl,
                        encryptionKey,
                        paths,
                    }),
            );
            return createFileResponse(
                paths.encrypted,
                createDatedBackupFileName("backup"),
                {
                    contentType: "application/octet-stream",
                    headers: { "x-backup-sha256": sha256 },
                    onClose: () => removeBackupTempPaths(paths),
                },
            );
        } catch (error) {
            await removeBackupTempPaths(paths);
            throw error;
        }
    });

    server.post("/database/imports/:operationId", async (c) => {
        const operationId = c.req.param("operationId");
        if (!OPERATION_ID_PATTERN.test(operationId)) {
            return c.json({ error: "Invalid operation identifier" }, 400);
        }
        const prepared = await importStore.prepare(operationId, c.req.raw);
        return c.json({
            operationId,
            sha256: prepared.sha256,
            size: prepared.size,
        });
    });

    server.delete("/database/imports/:operationId", async (c) => {
        await importStore.delete(c.req.param("operationId"));
        return c.body(null, 204);
    });

    server.post(
        "/database/imports/:operationId/emergency-backup",
        async (c) => {
            const operationId = c.req.param("operationId");
            if (!importStore.get(operationId)) {
                return c.json({ error: "Prepared import was not found" }, 404);
            }

            const paths = await createBackupTempPaths("api-pre-import");
            try {
                const sha256 = await withBackupAdvisoryLock(
                    config.databaseUrl,
                    () =>
                        createEncryptedDatabaseBackup({
                            databaseUrl: config.databaseUrl,
                            encryptionKey,
                            paths,
                        }),
                );
                return createFileResponse(
                    paths.encrypted,
                    createDatedBackupFileName("pre-import"),
                    {
                        contentType: "application/octet-stream",
                        headers: { "x-backup-sha256": sha256 },
                        onClose: () => removeBackupTempPaths(paths),
                    },
                );
            } catch (error) {
                await removeBackupTempPaths(paths);
                throw error;
            }
        },
    );

    server.post("/database/imports/:operationId/restore", async (c) => {
        const operationId = c.req.param("operationId");
        const prepared = importStore.get(operationId);
        if (!prepared) {
            return c.json({ error: "Prepared import was not found" }, 404);
        }
        if (restoringDatabase) {
            return c.json({ error: "Database restore is already active" }, 409);
        }

        restoringDatabase = true;
        try {
            await withBackupAdvisoryLock(config.databaseUrl, async () => {
                await restoreDatabaseDump(
                    config.databaseUrl,
                    prepared.paths.dump,
                );
                await normalizeRestoredDatabase(config.databaseUrl);
                await validateRestoredDatabase(config.databaseUrl);
            });
            await importStore.delete(operationId);
            return c.json({ operationId, status: "completed" as const });
        } finally {
            restoringDatabase = false;
        }
    });

    server.onError((error, c) => {
        logger.error({
            msg: "API request failed",
            ...getSafeErrorInfo(error),
            method: c.req.method,
            path: c.req.path,
        });

        if (error instanceof FileSizeLimitError) {
            return c.json({ error: "Uploaded file is too large" }, 413);
        }
        if (error instanceof BackupOperationBusyError) {
            return c.json(
                { error: "Another database operation is active" },
                409,
            );
        }
        return c.json({ error: "API request failed" }, 500);
    });

    return {
        close: () => importStore.close(),
        fetch: server.fetch,
    };
}
