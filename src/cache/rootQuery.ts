import { TTLCache } from "@/deps.ts";

import { rootCacheKey, rootCacheTime } from "@/src/constants/cache.ts";

import { InlineResultVoice } from "@/src/types/inline.ts";

type RootQueryCacheKey = typeof rootCacheKey;

export const rootQueryCache = new TTLCache<
    RootQueryCacheKey,
    InlineResultVoice[]
>({
    max: 1,
    ttl: rootCacheTime,
});
