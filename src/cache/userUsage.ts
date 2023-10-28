import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { userUsageCacheTime } from "@/src/constants/cache.ts";

export const userUsageCache = new TTLCache<number, number>({
    ttl: userUsageCacheTime,
});
