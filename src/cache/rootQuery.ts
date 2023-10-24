import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

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
