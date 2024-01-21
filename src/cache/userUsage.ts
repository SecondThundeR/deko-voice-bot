import { TTLCache } from "@/deps.ts";

import { userUsageCacheTime } from "@/src/constants/cache.ts";

export const userUsageCache = new TTLCache<number, number>({
    ttl: userUsageCacheTime,
});
