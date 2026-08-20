import { randomUUID } from "node:crypto";
import type { MiddlewareFn } from "grammy";
import { InputFile } from "grammy";

import { withDatabaseDisconnected } from "#drizzle/db.js";
import { databaseUrl } from "#drizzle/env.js";
import type { Context } from "#root/bot/context.js";
import { setCachedMaintenanceFeatureFlag } from "#root/bot/maintenance/state.js";
import { clearBotSessionState } from "#root/bot/session/state.js";
import type { Logger } from "#root/logger.js";
import { getSafeErrorInfo } from "#root/logging.js";
import { createEncryptedDatabaseBackup } from "./create.ts";
import {
    normalizeRestoredDatabase,
    restoreDatabaseDump,
    validateRestoredDatabase,
} from "./database.ts";
import { parseBackupEncryptionKey } from "./encryption.ts";
import { BackupOperationBusyError } from "./errors.ts";
import { withBackupAdvisoryLock } from "./lock.ts";
import {
    type BackupTempPaths,
    createBackupTempPaths,
    createDatedBackupFileName,
    removeBackupTempPaths,
} from "./paths.ts";

type SessionKey = `${number}:${number}`;

type ImportSession = {
    operationId: string;
    userId: number;
    chatId: number;
    expiresAt: number;
} & (
    | { stage: "awaiting-file" }
    | {
          stage: "awaiting-confirmation";
          paths: BackupTempPaths;
          sha256: string;
          size: number;
      }
);

export type ConfirmedImportSession = Extract<
    ImportSession,
    { stage: "awaiting-confirmation" }
>;

class ImportSessionStore {
    readonly #sessions = new Map<SessionKey, ImportSession>();
    readonly #timers = new Map<SessionKey, NodeJS.Timeout>();

    async start(userId: number, chatId: number, ttlMs: number) {
        await this.cancel(userId, chatId);
        const key = this.#key(userId, chatId);
        const session: ImportSession = {
            stage: "awaiting-file",
            operationId: randomUUID(),
            userId,
            chatId,
            expiresAt: Date.now() + ttlMs,
        };
        this.#sessions.set(key, session);
        this.#scheduleExpiration(key, session, ttlMs);
        return session;
    }

    get(userId: number, chatId: number) {
        const key = this.#key(userId, chatId);
        const session = this.#sessions.get(key);
        if (!session) return null;
        if (session.expiresAt <= Date.now()) {
            void this.#delete(key, session);
            return null;
        }
        return session;
    }

    takeAwaitingFile(userId: number, chatId: number) {
        const session = this.get(userId, chatId);
        if (session?.stage !== "awaiting-file") return null;
        this.#removeFromMemory(this.#key(userId, chatId));
        return session;
    }

    addAwaitingConfirmation(
        base: ImportSession,
        data: Omit<ConfirmedImportSession, keyof ImportSession | "stage"> & {
            paths: BackupTempPaths;
            sha256: string;
            size: number;
        },
        ttlMs: number,
    ) {
        const key = this.#key(base.userId, base.chatId);
        const session: ConfirmedImportSession = {
            ...base,
            ...data,
            stage: "awaiting-confirmation",
            expiresAt: Date.now() + ttlMs,
        };
        this.#sessions.set(key, session);
        this.#scheduleExpiration(key, session, ttlMs);
        return session;
    }

    takeForConfirmation(userId: number, chatId: number, operationId: string) {
        const session = this.get(userId, chatId);
        if (
            session?.stage !== "awaiting-confirmation" ||
            session.operationId !== operationId
        ) {
            return null;
        }
        this.#removeFromMemory(this.#key(userId, chatId));
        return session;
    }

    async cancel(userId: number, chatId: number) {
        const key = this.#key(userId, chatId);
        const session = this.#sessions.get(key);
        if (!session) return false;
        this.#removeFromMemory(key);
        await this.#cleanup(session);
        return true;
    }

    async clear() {
        for (const session of [...this.#sessions.values()]) {
            await this.cancel(session.userId, session.chatId);
        }
    }

    #key(userId: number, chatId: number): SessionKey {
        return `${userId}:${chatId}`;
    }

    #scheduleExpiration(
        key: SessionKey,
        session: ImportSession,
        ttlMs: number,
    ) {
        const previous = this.#timers.get(key);
        if (previous) clearTimeout(previous);
        const timer = setTimeout(() => void this.#delete(key, session), ttlMs);
        timer.unref();
        this.#timers.set(key, timer);
    }

    #removeFromMemory(key: SessionKey) {
        this.#sessions.delete(key);
        const timer = this.#timers.get(key);
        if (timer) clearTimeout(timer);
        this.#timers.delete(key);
    }

    async #delete(key: SessionKey, expected: ImportSession) {
        if (this.#sessions.get(key) !== expected) return;
        this.#removeFromMemory(key);
        await this.#cleanup(expected);
    }

    async #cleanup(session: ImportSession) {
        if (session.stage === "awaiting-confirmation") {
            await removeBackupTempPaths(session.paths);
        }
    }
}

export const importSessions = new ImportSessionStore();

let restoreMaintenanceActive = false;
let activeRequests = 0;
const drainWaiters = new Set<() => void>();

export function isDatabaseRestoreActive() {
    return restoreMaintenanceActive;
}

export function databaseTrafficGatekeep(): MiddlewareFn<Context> {
    return async (ctx, next) => {
        if (restoreMaintenanceActive) {
            if (ctx.inlineQuery) {
                return ctx.answerInlineQuery([], {
                    button: {
                        text: ctx.t("maintenance-inline-button"),
                        start_parameter: "maintenance",
                    },
                    cache_time: 30,
                    is_personal: true,
                });
            }
            return ctx.reply(ctx.t("maintenance-chat-unavailable"));
        }

        activeRequests += 1;
        try {
            await next();
        } finally {
            activeRequests -= 1;
            if (activeRequests <= 1) {
                for (const resolve of drainWaiters) resolve();
                drainWaiters.clear();
            }
        }
    };
}

async function beginRestoreMaintenance() {
    if (restoreMaintenanceActive) return false;
    restoreMaintenanceActive = true;
    while (activeRequests > 1) {
        await new Promise<void>((resolve) => drainWaiters.add(resolve));
    }
    return true;
}

type RestoreJob = {
    api: Context["api"];
    chatId: number;
    encryptionKey: string;
    logger: Logger;
    messageId?: number;
    messages: {
        completed: string;
        emergencyBackup: (sha256: string) => string;
        error: string;
        preparing: string;
    };
    session: ConfirmedImportSession;
};

class DatabaseRestoreCoordinator {
    #activeTask: Promise<void> | null = null;

    start(job: RestoreJob) {
        if (this.#activeTask) return false;
        const maintenance = beginRestoreMaintenance();
        const task = this.#run(job, maintenance).finally(() => {
            if (this.#activeTask === task) this.#activeTask = null;
        });
        this.#activeTask = task;
        return true;
    }

    waitForIdle() {
        return this.#activeTask ?? Promise.resolve();
    }

    async #run(job: RestoreJob, maintenance: Promise<boolean>) {
        const { api, chatId, logger, messageId, messages, session } = job;
        let maintenanceStarted = false;
        let emergencyPaths: BackupTempPaths | undefined;

        try {
            maintenanceStarted = await maintenance;
            if (!maintenanceStarted) throw new BackupOperationBusyError();
            await (messageId
                ? api.editMessageText(chatId, messageId, messages.preparing)
                : api.sendMessage(chatId, messages.preparing));

            const encryptionKey = parseBackupEncryptionKey(job.encryptionKey);
            emergencyPaths = await createBackupTempPaths("pre-import");
            const currentEmergencyPaths = emergencyPaths;

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
                    { caption: messages.emergencyBackup(emergencySha256) },
                );

                await withDatabaseDisconnected(async () => {
                    await restoreDatabaseDump(databaseUrl, session.paths.dump);
                    await normalizeRestoredDatabase(databaseUrl);
                });
                setCachedMaintenanceFeatureFlag(null);
                await validateRestoredDatabase(databaseUrl);
                clearBotSessionState();
                await importSessions.clear();
            });

            logger.info({
                msg: "Database import completed",
                operationId: session.operationId,
                sourceSha256: session.sha256,
                sourceSize: session.size,
            });
            await api.sendMessage(chatId, messages.completed);
        } catch (error) {
            logger.error({
                msg: "Database import failed",
                operationId: session.operationId,
                ...getSafeErrorInfo(error),
            });
            await api.sendMessage(chatId, messages.error).catch(() => {});
        } finally {
            if (maintenanceStarted) restoreMaintenanceActive = false;
            await Promise.allSettled([
                removeBackupTempPaths(session.paths),
                ...(emergencyPaths
                    ? [removeBackupTempPaths(emergencyPaths)]
                    : []),
            ]);
        }
    }
}

export const databaseRestoreCoordinator = new DatabaseRestoreCoordinator();
