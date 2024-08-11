import TTLCacheMain from "@isaacs/ttlcache";
import type { GetOptions, SetOptions } from "@isaacs/ttlcache";

import { oneHour, oneMinute } from "@/src/constants/milliseconds";

import { isCachingDisabled } from "@/src/helpers/cache";

import type { CacheStub } from "@/src/types/cache";

class TTLCacheStub<K, V> implements CacheStub<K, V> {
    clear() {
        return;
    }

    get(key: K, options?: GetOptions) {
        return undefined;
    }

    has(key: K) {
        return false;
    }

    set(key: K, value: V, options?: SetOptions): CacheStub<K, V> {
        return this;
    }

    delete(key: K): boolean {
        return false;
    }
}

export const rootCacheKey = "root";
export const ignoredUsersCacheKey = "ignored";
export const usersStatsCacheKey = "usersStats";
export const voicesStatsCacheKey = "voicesStats";

export const rootCacheTime = oneHour;
export const textCacheTime = 30 * oneMinute;
export const statsCacheTime = 30 * oneMinute;
export const userUsageCacheTime = 2 * oneHour;
export const favoriteVoicesCacheTime = 6 * oneHour;
export const ignoredUsersCacheTime = 12 * oneHour;
export const featureFlagsCacheTime = 24 * oneHour;
export const lastUsedAtCacheTime = Infinity;

export const TTLCache = isCachingDisabled() ? TTLCacheStub : TTLCacheMain;
