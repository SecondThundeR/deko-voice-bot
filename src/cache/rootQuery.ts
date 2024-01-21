import { TTLCache } from "@/deps.ts";

import { InlineQueryResultVoice } from "@/deps.ts";

import { rootCacheKey, rootCacheTime } from "@/src/constants/cache.ts";

type RootQueryCacheKey = typeof rootCacheKey;

export const rootQueryCache = new TTLCache<
    RootQueryCacheKey,
    InlineQueryResultVoice[]
>({
    max: 1,
    ttl: rootCacheTime,
});
