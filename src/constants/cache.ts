import { oneHour, oneMinute } from "@/src/constants/milliseconds.ts";

export const rootCacheKey = "root";
export const ignoredUsersCacheKey = "ignored";
export const rootCacheTime = oneHour;
export const textCacheTime = 30 * oneMinute;
export const userUsageCacheTime = 2 * oneHour;
export const ignoredUsersCacheTime = 12 * oneHour;
export const featureFlagsCacheTime = 24 * oneHour;
