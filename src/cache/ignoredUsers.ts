import TTLCache from "@isaacs/ttlcache";

import {
    ignoredUsersCacheKey,
    ignoredUsersCacheTime,
} from "@/src/constants/cache";

type IgnoredUsersCacheKey = typeof ignoredUsersCacheKey;

export const ignoredUsersCache = new TTLCache<IgnoredUsersCacheKey, number[]>({
    max: 1,
    ttl: ignoredUsersCacheTime,
});
