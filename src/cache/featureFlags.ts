import { TTLCache, FEATURE_FLAGS_CACHE_TIME } from "@/src/constants/cache";

export const featureFlagsCache = new TTLCache<string, boolean>({
    ttl: FEATURE_FLAGS_CACHE_TIME,
});
