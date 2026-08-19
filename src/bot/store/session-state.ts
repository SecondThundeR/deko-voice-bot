import type { ConversationData } from "@grammyjs/conversations";

import type { SessionData } from "#root/bot/context.js";
import {
    createTtlMemoryStorage,
    createTtlVersionedMemoryStorage,
} from "./ttl-memory-storage.ts";

const SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
const STORAGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1_000;

const storageOptions = {
    cleanupIntervalMs: STORAGE_CLEANUP_INTERVAL_MS,
    ttlMs: SESSION_TTL_MS,
};

export const sessionStorage =
    createTtlMemoryStorage<SessionData>(storageOptions);

export const conversationStorage =
    createTtlVersionedMemoryStorage<ConversationData>(storageOptions);

export function clearBotSessionState() {
    sessionStorage.clear();
    conversationStorage.clear();
}

export async function clearBotUserSessionState(userId: number) {
    await Promise.all([
        sessionStorage.delete(`session:${userId}`),
        conversationStorage.delete(`conversation:${userId}`),
    ]);
}
