import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { featureFlagsCacheTime } from "@/src/constants/cache.ts";
import { featureFlagsIDs } from "@/src/constants/featureFlagsIDs.ts";

type FeatureFlagsCacheKey = typeof featureFlagsIDs[number];

export const featureFlagsCache = new TTLCache<FeatureFlagsCacheKey, boolean>({
    max: featureFlagsIDs.length,
    ttl: featureFlagsCacheTime,
});
