import { TTLCache, LAST_USED_AT_CACHE_TIME } from "@/src/constants/cache";

export const lastUsedAtCache = new TTLCache<number, number | undefined>({
    ttl: LAST_USED_AT_CACHE_TIME,
});
