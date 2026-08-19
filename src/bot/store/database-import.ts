import { InputFile } from "grammy";

import { withDatabaseDisconnected } from "#drizzle/db.js";
import { databaseUrl } from "#drizzle/env.js";
import { createEncryptedDatabaseBackup } from "#root/backup/create.js";
import {
    normalizeRestoredDatabase,
    restoreDatabaseDump,
    validateRestoredDatabase,
} from "#root/backup/database.js";
import { parseBackupEncryptionKey } from "#root/backup/encryption.js";
import { BackupOperationBusyError } from "#root/backup/errors.js";
import { withBackupAdvisoryLock } from "#root/backup/lock.js";
import {
    createBackupTempPaths,
    createDatedBackupFileName,
    removeBackupTempPaths,
} from "#root/backup/paths.js";
import type { Context } from "#root/bot/context.js";
import type { Logger } from "#root/logger.js";
import { getSafeErrorInfo } from "#root/logging.js";
import { clearBotSessionState } from "#root/redis.js";
import {
    beginDatabaseImportMaintenance,
    endDatabaseImportMaintenance,
} from "./database-traffic.ts";
import {
    type ConfirmedImportSession,
    importSessions,
} from "./import-sessions.ts";
import { setCachedMaintenanceFeatureFlag } from "./maintenance.ts";

type ImportMessages = {
    completed: string;
    emergencyBackup: (sha256: string) => string;
    error: string;
    preparing: string;
};

type DatabaseImportJob = {
    api: Context["api"];
    chatId: number;
    encryptionKey: string;
    logger: Logger;
    messageId?: number;
    messages: ImportMessages;
    session: ConfirmedImportSession;
};

export class DatabaseImportCoordinator {
    #activeTask: Promise<void> | null = null;

    start(job: DatabaseImportJob) {
        if (this.#activeTask) {
            return false;
        }

        // The maintenance flag is set synchronously before the first await, so
        // no new update can reach the database after this method returns.
        const maintenance = beginDatabaseImportMaintenance();
        const task = this.#run(job, maintenance).finally(() => {
            if (this.#activeTask === task) {
                this.#activeTask = null;
            }
        });
        this.#activeTask = task;
        return true;
    }

    waitForIdle() {
        return this.#activeTask ?? Promise.resolve();
    }

    async #run(
        job: DatabaseImportJob,
        maintenance: Promise<boolean>,
    ): Promise<void> {
        const { api, chatId, logger, messageId, messages, session } = job;
        let maintenanceStarted = false;
        let emergencyPaths:
            | Awaited<ReturnType<typeof createBackupTempPaths>>
            | undefined;

        try {
            maintenanceStarted = await maintenance;
            if (!maintenanceStarted) {
                throw new BackupOperationBusyError();
            }

            await (messageId
                ? api.editMessageText(chatId, messageId, messages.preparing)
                : api.sendMessage(chatId, messages.preparing));

            const encryptionKey = parseBackupEncryptionKey(job.encryptionKey);
            const currentEmergencyPaths =
                await createBackupTempPaths("pre-import");
            emergencyPaths = currentEmergencyPaths;

            await withBackupAdvisoryLock(databaseUrl, async () => {
                const emergencySha256 = await createEncryptedDatabaseBackup({
                    databaseUrl,
                    encryptionKey,
                    paths: currentEmergencyPaths,
                });

                await api.sendDocument(
                    chatId,
                    new InputFile(
                        currentEmergencyPaths.encrypted,
                        createDatedBackupFileName("pre-import"),
                    ),
                    {
                        caption: messages.emergencyBackup(emergencySha256),
                    },
                );

                await withDatabaseDisconnected(async () => {
                    await restoreDatabaseDump(databaseUrl, session.paths.dump);
                    await normalizeRestoredDatabase(databaseUrl);
                });
                setCachedMaintenanceFeatureFlag(null);
                await validateRestoredDatabase(databaseUrl);
                await clearBotSessionState();
                await importSessions.clear();
            });

            logger.info({
                msg: "Database import completed",
                operationId: session.operationId,
                sourceSha256: session.sha256,
                sourceSize: session.size,
            });
            await api.sendMessage(chatId, messages.completed);
        } catch (error: unknown) {
            logger.error({
                msg: "Database import failed",
                operationId: session.operationId,
                sourceSha256: session.sha256,
                sourceSize: session.size,
                ...getSafeErrorInfo(error),
            });
            await api.sendMessage(chatId, messages.error).catch((sendError) => {
                logger.error({
                    msg: "Failed to send database import failure notice",
                    operationId: session.operationId,
                    ...getSafeErrorInfo(sendError),
                });
            });
        } finally {
            if (maintenanceStarted) {
                endDatabaseImportMaintenance();
            }
            await Promise.allSettled([
                removeBackupTempPaths(session.paths),
                ...(emergencyPaths
                    ? [removeBackupTempPaths(emergencyPaths)]
                    : []),
            ]);
        }
    }
}

export const databaseImportCoordinator = new DatabaseImportCoordinator();
