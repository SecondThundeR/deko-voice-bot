import { TTLCache, textCacheTime } from "@/src/constants/cache";

import type { InlineResultVoice } from "@/src/types/inline";

export const textQueryCache = new TTLCache<string, InlineResultVoice[]>({
    ttl: textCacheTime,
});
