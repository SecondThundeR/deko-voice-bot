import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { statsCacheTime, usersStatsCacheKey } from "@/src/constants/cache.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";

type UsersStatsCacheKey = typeof usersStatsCacheKey;

export const usersStatsCache = new TTLCache<
    UsersStatsCacheKey,
    UsersDataSchema[]
>({
    max: 1,
    ttl: statsCacheTime,
});
