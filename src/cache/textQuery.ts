import { TTLCache, TEXT_CACHE_TIME } from "@/src/constants/cache";

import type { InlineResultVoice } from "@/src/types/inline";

export const textQueryCache = new TTLCache<string, InlineResultVoice[]>({
    ttl: TEXT_CACHE_TIME,
});
