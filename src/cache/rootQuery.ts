import TTLCache from "@isaacs/ttlcache";

import { rootCacheKey, rootCacheTime } from "@/src/constants/cache";

import type { InlineResultVoice } from "@/src/types/inline";

type RootQueryCacheKey = typeof rootCacheKey;

export const rootQueryCache = new TTLCache<
    RootQueryCacheKey,
    InlineResultVoice[]
>({
    max: 1,
    ttl: rootCacheTime,
});
