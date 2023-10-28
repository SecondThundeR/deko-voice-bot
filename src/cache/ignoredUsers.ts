import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import {
    ignoredUsersCacheKey,
    ignoredUsersCacheTime,
} from "@/src/constants/cache.ts";

type IgnoredUsersCacheKey = typeof ignoredUsersCacheKey;

export const ignoredUsersCache = new TTLCache<IgnoredUsersCacheKey, number[]>({
    max: 1,
    ttl: ignoredUsersCacheTime,
});
