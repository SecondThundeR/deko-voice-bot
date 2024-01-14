import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

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
