import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { InlineQueryResultVoice } from "@/deps.ts";

import { textCacheTime } from "@/src/constants/cache.ts";

export const textQueryCache = new TTLCache<string, InlineQueryResultVoice[]>({
    ttl: textCacheTime,
});
