import { oneHour, oneMinute } from "@/src/constants/milliseconds.ts";

export const rootCacheKey = "root";
export const rootCacheTime = oneHour;
export const textCacheTime = 30 * oneMinute;
export const userUsageCacheTime = 2 * oneHour;
export const featureFlagsCacheTime = 24 * oneHour;
