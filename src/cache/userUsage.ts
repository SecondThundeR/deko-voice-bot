import { TTLCache, USER_USAGE_CACHE_TIME } from "@/src/constants/cache";

export const userUsageCache = new TTLCache<number, number>({
    ttl: USER_USAGE_CACHE_TIME,
});
