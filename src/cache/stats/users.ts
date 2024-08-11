import {
    TTLCache,
    STATS_CACHE_TIME,
    USERS_STATS_CACHE_KEY,
} from "@/src/constants/cache";

import type { UsersDataSchema } from "@/src/schemas/usersData";

type UsersStatsCacheKey = typeof USERS_STATS_CACHE_KEY;

export const usersStatsCache = new TTLCache<
    UsersStatsCacheKey,
    UsersDataSchema[]
>({
    max: 1,
    ttl: STATS_CACHE_TIME,
});
