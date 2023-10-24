import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import {
    featureFlagsCacheKeys,
    featureFlagsCacheTime,
} from "@/src/constants/cache.ts";

type FeatureFlagsCacheKey = typeof featureFlagsCacheKeys[number];

export const featureFlagsCache = new TTLCache<FeatureFlagsCacheKey, boolean>({
    max: featureFlagsCacheKeys.length,
    ttl: featureFlagsCacheTime,
});
