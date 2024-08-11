import {
    TTLCache,
    IGNORED_USERS_CACHE_KEY,
    IGNORED_USERS_CACHE_TIME,
} from "@/src/constants/cache";

type IgnoredUsersCacheKey = typeof IGNORED_USERS_CACHE_KEY;

export const ignoredUsersCache = new TTLCache<IgnoredUsersCacheKey, number[]>({
    max: 1,
    ttl: IGNORED_USERS_CACHE_TIME,
});
