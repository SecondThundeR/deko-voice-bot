import { TTLCache, featureFlagsCacheTime } from "@/src/constants/cache";

export const featureFlagsCache = new TTLCache<string, boolean>({
    ttl: featureFlagsCacheTime,
});
