import { randomUUID } from "node:crypto";
import type { BackupTempPaths } from "#root/backup/paths.js";
import { removeBackupTempPaths } from "#root/backup/paths.js";

type SessionKey = `${number}:${number}`;

type AwaitingFileSession = {
    stage: "awaiting-file";
};

type AwaitingConfirmationSession = {
    stage: "awaiting-confirmation";
    paths: BackupTempPaths;
    sha256: string;
    size: number;
};

export type ImportSession = {
    operationId: string;
    userId: number;
    chatId: number;
    expiresAt: number;
} & (AwaitingFileSession | AwaitingConfirmationSession);

export type ConfirmedImportSession = Extract<
    ImportSession,
    { stage: "awaiting-confirmation" }
>;

function getSessionKey(userId: number, chatId: number): SessionKey {
    return `${userId}:${chatId}`;
}

async function cleanupSessionFiles(session: ImportSession) {
    if (session.stage !== "awaiting-confirmation") {
        return;
    }

    await removeBackupTempPaths(session.paths);
}

export class ImportSessionStore {
    readonly #sessions = new Map<SessionKey, ImportSession>();
    readonly #timers = new Map<SessionKey, NodeJS.Timeout>();

    async start(userId: number, chatId: number, ttlMs: number) {
        await this.cancel(userId, chatId);

        const key = getSessionKey(userId, chatId);
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
        const key = getSessionKey(userId, chatId);
        const session = this.#sessions.get(key);
        if (!session) {
            return null;
        }

        if (session.expiresAt <= Date.now()) {
            void this.#delete(key, session);
            return null;
        }
        return session;
    }

    takeAwaitingFile(userId: number, chatId: number) {
        const session = this.get(userId, chatId);
        if (session?.stage !== "awaiting-file") {
            return null;
        }

        this.#removeFromMemory(getSessionKey(userId, chatId));
        return session;
    }

    addAwaitingConfirmation(
        base: ImportSession,
        data: Omit<AwaitingConfirmationSession, "stage">,
        ttlMs?: number,
    ) {
        const key = getSessionKey(base.userId, base.chatId);
        const session: ImportSession = {
            ...base,
            ...data,
            stage: "awaiting-confirmation",
            expiresAt:
                Date.now() +
                (ttlMs ?? Math.max(0, base.expiresAt - Date.now())),
        };
        this.#sessions.set(key, session);
        this.#scheduleExpiration(
            key,
            session,
            Math.max(0, session.expiresAt - Date.now()),
        );
        return session;
    }

    async clear() {
        const sessions = [...this.#sessions.values()];
        for (const session of sessions) {
            await this.cancel(session.userId, session.chatId);
        }
    }

    takeForConfirmation(userId: number, chatId: number, operationId: string) {
        const session = this.get(userId, chatId);
        if (
            session?.stage !== "awaiting-confirmation" ||
            session.operationId !== operationId
        ) {
            return null;
        }

        this.#removeFromMemory(getSessionKey(userId, chatId));
        return session;
    }

    async cancel(userId: number, chatId: number) {
        const key = getSessionKey(userId, chatId);
        const session = this.#sessions.get(key);
        if (!session) {
            return false;
        }

        this.#removeFromMemory(key);
        await cleanupSessionFiles(session);
        return true;
    }

    #scheduleExpiration(
        key: SessionKey,
        session: ImportSession,
        ttlMs: number,
    ) {
        const previousTimer = this.#timers.get(key);
        if (previousTimer) {
            clearTimeout(previousTimer);
        }

        const timer = setTimeout(() => {
            void this.#delete(key, session);
        }, ttlMs);
        timer.unref();
        this.#timers.set(key, timer);
    }

    #removeFromMemory(key: SessionKey) {
        this.#sessions.delete(key);
        const timer = this.#timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.#timers.delete(key);
        }
    }

    async #delete(key: SessionKey, expectedSession: ImportSession) {
        const currentSession = this.#sessions.get(key);
        if (currentSession !== expectedSession) {
            return;
        }

        this.#removeFromMemory(key);
        await cleanupSessionFiles(expectedSession);
    }
}

export const importSessions = new ImportSessionStore();
