import {
    TTLCache,
    statsCacheTime,
    usersStatsCacheKey,
} from "@/src/constants/cache";

import type { UsersDataSchema } from "@/src/schemas/usersData";

type UsersStatsCacheKey = typeof usersStatsCacheKey;

export const usersStatsCache = new TTLCache<
    UsersStatsCacheKey,
    UsersDataSchema[]
>({
    max: 1,
    ttl: statsCacheTime,
});
