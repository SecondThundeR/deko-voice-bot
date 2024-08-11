import TTLCacheMain from "@isaacs/ttlcache";
import type { GetOptions, SetOptions } from "@isaacs/ttlcache";

import { ONE_HOUR, ONE_MINUTE } from "@/src/constants/milliseconds";

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

export const ROOT_CACHE_KEY = "root";
export const IGNORED_USERS_CACHE_KEY = "ignored";
export const USERS_STATS_CACHE_KEY = "usersStats";
export const VOICES_STATS_CACHE_KEY = "voicesStats";

export const ROOT_CACHE_TIME = ONE_HOUR;
export const TEXT_CACHE_TIME = 30 * ONE_MINUTE;
export const STATS_CACHE_TIME = 30 * ONE_MINUTE;
export const USER_USAGE_CACHE_TIME = 2 * ONE_HOUR;
export const FAVORITE_VOICES_CACHE_TIME = 6 * ONE_HOUR;
export const IGNORED_USERS_CACHE_TIME = 12 * ONE_HOUR;
export const FEATURE_FLAGS_CACHE_TIME = 24 * ONE_HOUR;
export const LAST_USED_AT_CACHE_TIME = Infinity;

export const TTLCache = isCachingDisabled() ? TTLCacheStub : TTLCacheMain;
