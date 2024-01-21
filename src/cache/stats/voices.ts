import { TTLCache } from "@/deps.ts";

import { statsCacheTime, voicesStatsCacheKey } from "@/src/constants/cache.ts";

import { VoiceSchema } from "@/src/schemas/voice.ts";

type VoicesStatsCacheKey = typeof voicesStatsCacheKey;

export const voicesStatsCache = new TTLCache<
    VoicesStatsCacheKey,
    VoiceSchema[]
>({
    max: 1,
    ttl: statsCacheTime,
});
