import { TTLCache, userUsageCacheTime } from "@/src/constants/cache";

export const userUsageCache = new TTLCache<number, number>({
    ttl: userUsageCacheTime,
});
