import TTLCache from "@isaacs/ttlcache";

import { lastUsedAtCacheTime } from "@/src/constants/cache";

export const lastUsedAtCache = new TTLCache<number, number | undefined>({
    ttl: lastUsedAtCacheTime,
});
