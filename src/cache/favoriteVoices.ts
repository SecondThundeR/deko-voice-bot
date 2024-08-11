import { TTLCache, FAVORITE_VOICES_CACHE_TIME } from "@/src/constants/cache";

export const favoriteVoicesIdsCache = new TTLCache<number, string[]>({
    ttl: FAVORITE_VOICES_CACHE_TIME,
});
