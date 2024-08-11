import {
    TTLCache,
    STATS_CACHE_TIME,
    VOICES_STATS_CACHE_KEY,
} from "@/src/constants/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

type VoicesStatsCacheKey = typeof VOICES_STATS_CACHE_KEY;

export const voicesStatsCache = new TTLCache<
    VoicesStatsCacheKey,
    VoiceSchema[]
>({
    max: 1,
    ttl: STATS_CACHE_TIME,
});
