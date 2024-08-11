import { oneHour, oneMinute } from "@/src/constants/milliseconds";

export const rootCacheKey = "root";
export const ignoredUsersCacheKey = "ignored";
export const usersStatsCacheKey = "usersStats";
export const voicesStatsCacheKey = "voicesStats";

export const rootCacheTime = oneHour;
export const textCacheTime = 30 * oneMinute;
export const statsCacheTime = 30 * oneMinute;
export const userUsageCacheTime = 2 * oneHour;
export const favoriteVoicesCacheTime = 6 * oneHour;
export const ignoredUsersCacheTime = 12 * oneHour;
export const featureFlagsCacheTime = 24 * oneHour;
export const lastUsedAtCacheTime = Infinity;
