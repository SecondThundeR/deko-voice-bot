import { TTLCache } from "@/deps.ts";

import { textCacheTime } from "@/src/constants/cache.ts";

import { InlineResultVoice } from "@/src/types/inline.ts";

export const textQueryCache = new TTLCache<string, InlineResultVoice[]>({
    ttl: textCacheTime,
});
