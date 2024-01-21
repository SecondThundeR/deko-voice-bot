import { TTLCache } from "@/deps.ts";

import {
    ignoredUsersCacheKey,
    ignoredUsersCacheTime,
} from "@/src/constants/cache.ts";

type IgnoredUsersCacheKey = typeof ignoredUsersCacheKey;

export const ignoredUsersCache = new TTLCache<IgnoredUsersCacheKey, number[]>({
    max: 1,
    ttl: ignoredUsersCacheTime,
});
