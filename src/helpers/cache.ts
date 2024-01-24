import { usersStatsCache } from "@/src/cache/stats/users.ts";
import { voicesStatsCache } from "@/src/cache/stats/voices.ts";
import { favoriteVoicesIdsCache } from "@/src/cache/favoriteVoices.ts";
import { featureFlagsCache } from "@/src/cache/featureFlags.ts";
import { ignoredUsersCache } from "@/src/cache/ignoredUsers.ts";
import { lastUsedAtCache } from "@/src/cache/lastUsedAt.ts";
import { rootQueryCache } from "@/src/cache/rootQuery.ts";
import { textQueryCache } from "@/src/cache/textQuery.ts";
import { userUsageCache } from "@/src/cache/userUsage.ts";

import {
    ignoredUsersCacheKey,
    rootCacheKey,
    usersStatsCacheKey,
    voicesStatsCacheKey,
} from "@/src/constants/cache.ts";

import { getIgnoredUsersArray } from "@/src/database/general/ignoredUsers/getIgnoredUsersArray.ts";
import { getFavoritesData } from "@/src/database/general/usersData/getFavoritesData.ts";
import { getLastUsedAtTime } from "@/src/database/general/usersData/getLastUsedAtTime.ts";
import { getUserUsageAmount } from "@/src/database/general/usersData/getUserUsageAmount.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";

import { InlineResultVoice } from "@/src/types/inline.ts";

type FavoriteStatusUpdateData = {
    userID: number;
    voiceID: string;
    newStatus: boolean;
};

type FavoritesCacheUpdateData = Omit<FavoriteStatusUpdateData, "newStatus"> & {
    currentFavorites: string[];
};

/**
 * Invalidates root cache by clearing it
 */
export function invalidateRootCache() {
    rootQueryCache.clear();
}

/**
 * Checks if root cache or text query cache has data and returns it
 *
 * If cache doesn't have data, returns `undefined`
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
        const filterCallback = rootQueryCacheFilterCallback(queryString);
        const filteredQueries = rootQueryCache.get(rootCacheKey)!.filter(
            filterCallback,
        );
        textQueryCache.set(queryString, filteredQueries);
        return filteredQueries;
    }
}

/**
 * Updates cache with filtered voice queries
 *
 * @param queryString Query string for inline
 * @param voicesQueries Array of queries with voice results
 */
export function updateTextQueryCache(
    queryString: string,
    voicesQueries: InlineResultVoice[],
) {
    return textQueryCache.set(queryString, voicesQueries);
}

/**
 * Updates cache with regular voice queries
 *
 * @param voicesQueries Array of queries with voice results
 */
export function updateRootQueryCache(voicesQueries: InlineResultVoice[]) {
    return rootQueryCache.set(rootCacheKey, voicesQueries);
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
 * Updates ignored users cache by adding user with given ID
 *
 * @description If cache is not setup already, sets to empty array.
 *
 * @param userID ID of user to add to cache
 */
export function addNewIgnoredUserInCache(userID: number) {
    const currentCacheStatus = getCachedIgnoredUsersArray();
    const updatedIgnoredUsers = currentCacheStatus.concat(userID);

    ignoredUsersCache.set(ignoredUsersCacheKey, updatedIgnoredUsers);
}

/**
 * Updates ignored users cache by removing user with given ID
 *
 * @description If cache is not setup already, sets to empty array.
 *
 * @param userID ID of user to remove from cache
 */
export function removeIgnoredUserFromCache(userID: number) {
    const currentCacheStatus = getCachedIgnoredUsersArray();
    const filteredIgnoredUsers = currentCacheStatus
        .filter((uid) => uid !== userID);

    ignoredUsersCache.set(ignoredUsersCacheKey, filteredIgnoredUsers);
}

/**
 * Extracts non-Telegram user data from cache/DB
 *
 * @param userID ID of user to extract uses amount and last used at time
 * @returns Object with extracted data
 */
export async function extractOtherUserData(userID: number) {
    const usesAmount = await getUserUsageCacheData(userID);
    const lastUsedAt = await getLastUsedAtCacheData(userID);

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

    await updateFavoriteVoiceStatusArray(userID);
    return favoriteVoicesIdsCache.get(userID);
}

/**
 * Updates cached favorites voice data and returns updated array
 *
 * @summary If there are certain situations (e.g, false/false or true/true),
 * cache won't be updated and current array will be returned as is
 *
 * @param data Data, needed for updating favorite voice status
 * @returns Updated favorites array
 */
export async function updateFavoriteVoiceStatus(
    { userID, voiceID, newStatus }: FavoriteStatusUpdateData,
) {
    const currentFavorites = getCachedFavoritesArray(userID);
    const currentStatus = await getFavoriteVoiceStatus(userID, voiceID);
    const isAddingFavorite = newStatus && !currentStatus;
    const isRemovingFavorite = !newStatus && currentStatus;

    if (isAddingFavorite) {
        return addFavoriteFromCache({ currentFavorites, userID, voiceID });
    }

    if (isRemovingFavorite) {
        return removeFavoriteFromCache({ currentFavorites, userID, voiceID });
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
    const favoriteVoiceData = await getFavoriteVoiceStatusArray(userID);
    return favoriteVoiceData?.includes(voiceID) ?? false;
}

/**
 * Returns cached status of feature flag
 *
 * @description If feature flag is not cached, returns `undefined` instead
 *
 * @param id ID of feature flag to get cached value
 * @returns Feature flag status or `undefined`, if cache isn't set
 */
export function getCachedFeatureFlag(id: string) {
    return featureFlagsCache.get(id);
}

/**
 * Sets new status for feature flag in cache
 *
 * @param id ID of feature flag to update
 * @param status Status of feature flag to set
 */
export function updateCachedFeatureFlag(id: string, status: boolean) {
    featureFlagsCache.set(id, status);
}

/**
 * Removes feature flag status from cache
 *
 * @param id ID of feature flag to remove
 */
export function deleteCachedFeatureFlag(id: string) {
    featureFlagsCache.delete(id);
}

/**
 * Returns cached users stats data
 */
export function getCachedUsersStatsData() {
    return usersStatsCache.get(usersStatsCacheKey);
}

/**
 * Returns cached voices stats data
 */
export function getCachedVoicesStatsData() {
    return voicesStatsCache.get(voicesStatsCacheKey);
}

/**
 * Sets new cached users stats data
 *
 * @param usersStats New users stats to cache
 */
export function setCachedUsersStatsData(usersStats: UsersDataSchema[]) {
    usersStatsCache.set(usersStatsCacheKey, usersStats);
}

/**
 * Sets new cached voices stats data
 *
 * @param voicesStats New voices stats to cache
 */
export function setCachedVoicesStatsData(voicesStats: VoiceSchema[]) {
    voicesStatsCache.set(voicesStatsCacheKey, voicesStats);
}

/**
 * Closure, that returns a callback for use in queries filter method
 * with saved query string value
 *
 * @param queryString Query text for filtering
 * @returns Callback for use in filter method
 */
function rootQueryCacheFilterCallback(queryString: string) {
    return function (query: InlineResultVoice) {
        return query.title.toLocaleLowerCase().includes(queryString);
    };
}

/**
 * Gets latest user's usage data and updates related cache
 *
 * @param userID ID of user
 */
async function updateUserUsageCacheData(userID: number) {
    const dbUsageAmount = await getUserUsageAmount(userID);
    userUsageCache.set(userID, dbUsageAmount);
}

/**
 * Gets user's usage data from cache. If cache is clear,
 * updates cache and return latest data instead
 *
 * @param userID ID of user
 */
async function getUserUsageCacheData(userID: number) {
    if (userUsageCache.has(userID)) {
        return userUsageCache.get(userID)!;
    }

    await updateUserUsageCacheData(userID);
    return userUsageCache.get(userID)!;
}

/**
 * Gets latest user's last used at time and updates related cache
 *
 * @param userID ID of user
 */
async function updateLastUsedAtCacheData(userID: number) {
    const lastUsedAtTime = await getLastUsedAtTime(userID);
    lastUsedAtCache.set(userID, lastUsedAtTime);
}

/**
 * Gets user's last used at time from cache. If cache is clear,
 * updates cache and return latest data instead
 *
 * @param userID ID of user
 */
async function getLastUsedAtCacheData(userID: number) {
    if (lastUsedAtCache.has(userID)) {
        return lastUsedAtCache.get(userID)!;
    }

    await updateLastUsedAtCacheData(userID);
    return lastUsedAtCache.get(userID)!;
}

/**
 * Gets latest favorites data of user and updates related cache
 *
 * @param userID ID of user
 */
async function updateFavoriteVoiceStatusArray(userID: number) {
    const latestFavoritesData = await getFavoritesData(userID);
    favoriteVoicesIdsCache.set(userID, latestFavoritesData);
}

/**
 * Adds new favorite voice ID to cache and returns updated array of favorites
 *
 * @param data Data, needed for adding new favorite ID
 * @returns Updated array of favorites
 */
function addFavoriteFromCache({
    currentFavorites,
    userID,
    voiceID,
}: FavoritesCacheUpdateData) {
    const updatedArray = currentFavorites.concat(voiceID);
    favoriteVoicesIdsCache.set(userID, updatedArray);
    return updatedArray;
}

/**
 * Removes new favorite voice ID to cache and returns updated array of favorites
 *
 * @param data Data, needed for removing current favorite ID
 * @returns Updated array of favorites
 */
function removeFavoriteFromCache({
    currentFavorites,
    userID,
    voiceID,
}: FavoritesCacheUpdateData) {
    const updatedArray = currentFavorites.filter((id) => id !== voiceID);
    favoriteVoicesIdsCache.set(userID, updatedArray);
    return updatedArray;
}

/**
 * Returns cache user's favorite voices array
 *
 * @description If cache is empty, returns empty array
 *
 * @param userID ID of user to get favorites array
 * @returns Current cached array of favorite voices or empty, if cache is `undefined`
 */
function getCachedFavoritesArray(userID: number) {
    return favoriteVoicesIdsCache.get(userID) ?? [];
}

/**
 * Returns cached array of ignored users
 *
 * @description If cache is empty, returns empty array
 *
 * @returns Current cached array ignored users or empty, if cache is `undefined`
 */
function getCachedIgnoredUsersArray() {
    return ignoredUsersCache.get(ignoredUsersCacheKey) ?? [];
}
