import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { favoriteVoicesCacheTime } from "@/src/constants/cache.ts";

export const favoriteVoicesIdsCache = new TTLCache<number, string[]>({
    ttl: favoriteVoicesCacheTime,
});
