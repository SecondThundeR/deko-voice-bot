import {
    TTLCache,
    statsCacheTime,
    voicesStatsCacheKey,
} from "@/src/constants/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

type VoicesStatsCacheKey = typeof voicesStatsCacheKey;

export const voicesStatsCache = new TTLCache<
    VoicesStatsCacheKey,
    VoiceSchema[]
>({
    max: 1,
    ttl: statsCacheTime,
});
