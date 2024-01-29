import { TTLCache } from "@/deps.ts";

import { favoriteVoicesCacheTime } from "@/src/constants/cache.ts";

export const favoriteVoicesIdsCache = new TTLCache<number, string[]>({
    ttl: favoriteVoicesCacheTime,
});
