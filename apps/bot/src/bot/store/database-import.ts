import {
    BackupOperationBusyError,
    createBackupTempPaths,
    removeBackupTempPaths,
} from "@deko-voice-bot/backup";
import { getSafeErrorInfo } from "@deko-voice-bot/shared";
import { InputFile } from "grammy";
import {
    closeDatabaseConnection,
    reopenDatabaseConnection,
} from "#drizzle/db.js";
import type { Context } from "#root/bot/context.js";
import type { Logger } from "#root/logger.js";
import { operationsClient } from "#root/operations/client.js";
import {
    beginDatabaseImportMaintenance,
    endDatabaseImportMaintenance,
} from "./database-traffic.ts";
import {
    type ConfirmedImportSession,
    importSessions,
} from "./import-sessions.ts";
import { setCachedMaintenanceFeatureFlag } from "./maintenance.ts";
import { clearBotSessionState } from "./session-state.ts";

type ImportMessages = {
    completed: string;
    emergencyBackup: (sha256: string) => string;
    error: string;
    preparing: string;
};

type DatabaseImportJob = {
    api: Context["api"];
    chatId: number;
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
        let databaseDisconnected = false;
        let maintenanceStarted = false;
        let restoreMayBeActive = false;
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

            const currentEmergencyPaths =
                await createBackupTempPaths("pre-import");
            emergencyPaths = currentEmergencyPaths;

            const emergencyBackup =
                await operationsClient.downloadEmergencyBackup(
                    session.operationId,
                    currentEmergencyPaths.encrypted,
                );

            await api.sendDocument(
                chatId,
                new InputFile(
                    currentEmergencyPaths.encrypted,
                    emergencyBackup.fileName,
                ),
                {
                    caption: messages.emergencyBackup(emergencyBackup.sha256),
                },
            );

            await closeDatabaseConnection();
            databaseDisconnected = true;
            try {
                restoreMayBeActive = true;
                await operationsClient.restoreImport(session.operationId);
            } finally {
                await operationsClient.waitForRestoreIdle();
                restoreMayBeActive = false;
            }
            await reopenDatabaseConnection();
            databaseDisconnected = false;
            setCachedMaintenanceFeatureFlag(null);
            clearBotSessionState();
            await importSessions.clear();

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
            if (restoreMayBeActive) {
                try {
                    await operationsClient.waitForRestoreIdle();
                    restoreMayBeActive = false;
                } catch (error) {
                    logger.error({
                        msg: "Could not confirm that database restore is idle",
                        operationId: session.operationId,
                        ...getSafeErrorInfo(error),
                    });
                }
            }
            if (databaseDisconnected && !restoreMayBeActive) {
                try {
                    await reopenDatabaseConnection();
                    databaseDisconnected = false;
                } catch (error) {
                    logger.error({
                        msg: "Could not reconnect after database restore",
                        operationId: session.operationId,
                        ...getSafeErrorInfo(error),
                    });
                }
            }
            if (
                maintenanceStarted &&
                !restoreMayBeActive &&
                !databaseDisconnected
            ) {
                endDatabaseImportMaintenance();
            }
            await Promise.allSettled([
                ...(!restoreMayBeActive
                    ? [operationsClient.cancelImport(session.operationId)]
                    : []),
                ...(emergencyPaths
                    ? [removeBackupTempPaths(emergencyPaths)]
                    : []),
            ]);
        }
    }
}

export const databaseImportCoordinator = new DatabaseImportCoordinator();
