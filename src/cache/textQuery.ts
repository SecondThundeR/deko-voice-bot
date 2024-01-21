import { TTLCache } from "@/deps.ts";

import { InlineQueryResultVoice } from "@/deps.ts";

import { textCacheTime } from "@/src/constants/cache.ts";

export const textQueryCache = new TTLCache<string, InlineQueryResultVoice[]>({
    ttl: textCacheTime,
});
