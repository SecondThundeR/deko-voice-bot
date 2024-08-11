import { TTLCache, favoriteVoicesCacheTime } from "@/src/constants/cache";

export const favoriteVoicesIdsCache = new TTLCache<number, string[]>({
    ttl: favoriteVoicesCacheTime,
});
