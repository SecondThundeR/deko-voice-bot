import { TTLCache } from "@/deps.ts";

import { featureFlagsCacheTime } from "@/src/constants/cache.ts";

export const featureFlagsCache = new TTLCache<string, boolean>({
    ttl: featureFlagsCacheTime,
});
