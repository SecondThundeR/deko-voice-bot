import {
    TTLCache,
    ROOT_CACHE_KEY,
    ROOT_CACHE_TIME,
} from "@/src/constants/cache";

import type { InlineResultVoice } from "@/src/types/inline";

type RootQueryCacheKey = typeof ROOT_CACHE_KEY;

export const rootQueryCache = new TTLCache<
    RootQueryCacheKey,
    InlineResultVoice[]
>({
    max: 1,
    ttl: ROOT_CACHE_TIME,
});
