import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

import { featureFlagsCacheTime } from "@/src/constants/cache.ts";

export const featureFlagsCache = new TTLCache<string, boolean>({
    ttl: featureFlagsCacheTime,
});
