import { oneHour, oneMinute } from "@/src/constants/milliseconds.ts";

export const rootCacheKey = "root";
export const featureFlagsCacheKeys = ["maintenance"] as const;
export const rootCacheTime = oneHour;
export const textCacheTime = 30 * oneMinute;
export const featureFlagsCacheTime = 24 * oneHour;
