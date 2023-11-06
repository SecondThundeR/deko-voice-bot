import { InlineQueryResultVoice } from "@/deps.ts";

import { rootQueryCache } from "@/src/cache/rootQuery.ts";
import { textQueryCache } from "@/src/cache/textQuery.ts";
import { ignoredUsersCacheKey, rootCacheKey } from "@/src/constants/cache.ts";
import { ignoredUsersCache } from "@/src/cache/ignoredUsers.ts";
import { getIgnoredUsersArray } from "@/src/database/deko/ignoredUsers/getIgnoredUsersArray.ts";
import { userUsageCache } from "@/src/cache/userUsage.ts";
import { lastUsedAtCache } from "@/src/cache/lastUsedAt.ts";
import { getUserUsageAmount } from "@/src/database/deko/usersData/getUserUsageAmount.ts";
import { getUserLastUsedAtTime } from "@/src/database/deko/usersData/getUserLastUsedAtTime.ts";
import { favoriteVoicesIdsCache } from "@/src/cache/favoriteVoices.ts";
import { getFavoritesData } from "@/src/database/deko/usersData/getFavoritesData.ts";

/**
 * Invalidates root cache by clearing it
 */
export function invalidateRootCache() {
    rootQueryCache.clear();
}

/**
 * Checks if root cache or text query cache has data and returns it
 *
 * If cache doesn't have data, returns undefined
 *
 * @param queryString Query string from inline request
 * @returns Array of voice queries or undefined, if cache doesn't have related data
 */
export function checkQueriesCache(queryString: string) {
    if (queryString.length === 0 && rootQueryCache.has(rootCacheKey)) {
        return rootQueryCache.get(rootCacheKey)!;
    }

    if (textQueryCache.has(queryString)) {
        return textQueryCache.get(queryString)!;
    }

    if (rootQueryCache.has(rootCacheKey)) {
        const filteredQueries = [...rootQueryCache.get(rootCacheKey)!].filter((
            query,
        ) => query.title.toLocaleLowerCase().includes(queryString));
        textQueryCache.set(queryString, filteredQueries);
        return filteredQueries;
    }
}

/**
 * Updates cache with voice queries, depending on mode (root or text query)
 *
 * @param queryString Query string for inline
 * @param voicesQueries Array of queries with voice results
 */
export function updateQueriesCache(
    queryString: string,
    voicesQueries: InlineQueryResultVoice[],
) {
    if (queryString.length > 0) {
        textQueryCache.set(queryString, voicesQueries);
        return;
    }

    rootQueryCache.set(rootCacheKey, voicesQueries);
}

/**
 * Checks if user is not an ignored user for stats or not
 *
 * @param userID ID of user to check ignore status
 * @returns True if user is not ignored, False if already ignored
 */
export async function getUserIgnoreStatus(userID: number) {
    const currentIgnoredUsers = await getIgnoredUsersArray();
    return currentIgnoredUsers.includes(userID);
}

/**
 * Updates ignores users cache (Add userID, or remove it)
 *
 * If cache is not setup already, sets to empty array.
 *
 * @param userID ID of user to update cache with
 * @param action Action of update (add, remove)
 */
export function updateIgnoredUsersCache(
    userID: number,
    action: "add" | "remove",
) {
    if (ignoredUsersCache.has(ignoredUsersCacheKey)) {
        ignoredUsersCache.set(ignoredUsersCacheKey, []);
    }

    const currentCacheStatus = ignoredUsersCache.get(ignoredUsersCacheKey)!;

    if (action === "add") {
        ignoredUsersCache.set(ignoredUsersCacheKey, [
            ...currentCacheStatus,
            userID,
        ]);
    } else {
        ignoredUsersCache.set(
            ignoredUsersCacheKey,
            currentCacheStatus.filter((uid) => uid !== userID),
        );
    }
}

/**
 * Extracts non-Telegram user data from cache/DB
 *
 * @param userID ID of user to extract uses amount and last used at time
 * @returns Object with extracted data
 */
export async function extractOtherUserData(userID: number) {
    if (!userUsageCache.has(userID)) {
        const dbUsageAmount = await getUserUsageAmount(userID);
        userUsageCache.set(userID, dbUsageAmount);
    }
    const usesAmount = userUsageCache.get(userID)!;

    if (!lastUsedAtCache.has(userID)) {
        const lastUsedAtTime = await getUserLastUsedAtTime(userID);
        lastUsedAtCache.set(userID, lastUsedAtTime);
    }
    const lastUsedAt = lastUsedAtCache.get(userID)!;

    return { usesAmount, lastUsedAt };
}

/**
 * Retrieves current favorite voice status array for certain user
 *
 * @description If cache has data, returns it. Otherwise, gets latest from database
 *
 * @param userID ID of user to get current favorite voice status array
 * @returns Array with favorite voice ids
 */
export async function getFavoriteVoiceStatusArray(userID: number) {
    if (favoriteVoicesIdsCache.has(userID)) {
        return favoriteVoicesIdsCache.get(userID);
    }

    const latestFavoritesData = await getFavoritesData(userID);
    favoriteVoicesIdsCache.set(userID, latestFavoritesData);
    return latestFavoritesData;
}

/**
 * Updates cached favorites voice data and returns updated array
 *
 * @summary If there are certain situations (e.g, false/false or true/true),
 * so cache won't be updated and current array will be returned as is
 *
 * @param userID ID of user to update favorites array
 * @param voiceID ID of voice to add/remove to/from cached array
 * @param newStatus New status of voice to add/remove
 * @returns Updated favorites array
 */
export async function updateFavoriteVoiceStatus(
    userID: number,
    voiceID: string,
    newStatus: boolean,
) {
    const currentFavorites = favoriteVoicesIdsCache.get(userID) ?? [];
    const currentStatus = await getFavoriteVoiceStatus(userID, voiceID);

    if (!newStatus && currentStatus) {
        const updatedArray = currentFavorites.filter((id) => id !== voiceID);
        favoriteVoicesIdsCache.set(userID, updatedArray);
        return updatedArray;
    }

    if (newStatus && !currentStatus) {
        const updatedArray = [...currentFavorites, voiceID];
        favoriteVoicesIdsCache.set(userID, updatedArray);
        return updatedArray;
    }

    return currentFavorites;
}

/**
 * Returns voice favorite status for certain user
 *
 * @param userID ID of user to get favorites for
 * @param voiceID ID of voice to check if it is favored
 * @returns True if voice is favored, False otherwise
 */
export async function getFavoriteVoiceStatus(userID: number, voiceID: string) {
    if (!favoriteVoicesIdsCache.has(userID)) {
        const currentFavorites = await getFavoriteVoiceStatusArray(userID);
        return currentFavorites?.includes(voiceID) ?? false;
    }
    return favoriteVoicesIdsCache.get(userID)?.includes(voiceID) ?? false;
}
