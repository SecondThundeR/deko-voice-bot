import type { VersionedStateStorage } from "@grammyjs/conversations";
import type { StorageAdapter } from "grammy";

type TtlMemoryStorageOptions = {
    cleanupIntervalMs?: number;
    ttlMs: number;
};

type StorageEntry<T> = {
    expiresAt: number;
    value: T;
};

export function createTtlMemoryStorage<T>(
    options: TtlMemoryStorageOptions,
): StorageAdapter<T> {
    return createBaseTtlMemoryStorage<T>(options);
}

export function createTtlVersionedMemoryStorage<T>(
    options: TtlMemoryStorageOptions,
): VersionedStateStorage<string, T> {
    return createBaseTtlMemoryStorage(options);
}

function createBaseTtlMemoryStorage<T>({
    cleanupIntervalMs,
    ttlMs,
}: TtlMemoryStorageOptions): StorageAdapter<T> {
    const storage = new Map<string, StorageEntry<T>>();
    const cleanupMs = cleanupIntervalMs ?? ttlMs;

    function isExpired(entry: StorageEntry<T>) {
        return entry.expiresAt <= Date.now();
    }

    function cleanup() {
        for (const [key, entry] of storage.entries()) {
            if (isExpired(entry)) {
                storage.delete(key);
            }
        }
    }

    const cleanupInterval = setInterval(cleanup, cleanupMs);
    cleanupInterval.unref?.();

    return {
        delete: (key) => {
            storage.delete(key);
        },
        has: (key) => {
            const entry = storage.get(key);
            if (!entry) {
                return false;
            }

            if (isExpired(entry)) {
                storage.delete(key);
                return false;
            }

            return true;
        },
        read: (key) => {
            const entry = storage.get(key);
            if (!entry) {
                return undefined;
            }

            if (isExpired(entry)) {
                storage.delete(key);
                return undefined;
            }

            return entry.value;
        },
        readAllEntries: () => {
            cleanup();
            return Array.from(storage.entries()).map(([key, entry]) => [
                key,
                entry.value,
            ]);
        },
        readAllKeys: () => {
            cleanup();
            return Array.from(storage.keys());
        },
        readAllValues: () => {
            cleanup();
            return Array.from(storage.values()).map(({ value }) => value);
        },
        write: (key, value) => {
            storage.set(key, {
                expiresAt: Date.now() + ttlMs,
                value,
            });
        },
    };
}
