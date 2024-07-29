import TTLCache from "@isaacs/ttlcache";

import { featureFlagsCacheTime } from "@/src/constants/cache";

export const featureFlagsCache = new TTLCache<string, boolean>({
    ttl: featureFlagsCacheTime,
});
