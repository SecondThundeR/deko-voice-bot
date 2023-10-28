import { InlineQueryResultVoice } from "@/deps.ts";

import { rootQueryCache } from "@/src/cache/rootQuery.ts";
import { textQueryCache } from "@/src/cache/textQuery.ts";
import { ignoredUsersCacheKey, rootCacheKey } from "@/src/constants/cache.ts";
import { ignoredUsersCache } from "@/src/cache/ignoredUsers.ts";
import { getIgnoredUsersArray } from "@/src/database/deko/ignoredUsers/getIgnoredUsersArray.ts";

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
 * Checks if user is already an ignored user for stats
 *
 * @param userID ID of user
 * @returns True if user is already ignored, false if not
 */
export async function isUserAlreadyIgnored(userID: number) {
    const currentIgnoredUsers = await getIgnoredUsersArray();
    return currentIgnoredUsers.includes(userID);
}

/**
 * Checks if user is not an ignored user for stats
 *
 * @param userID ID of user
 * @returns True if user is not ignored, false if already ignored
 */
export async function isUserNotIgnored(userID: number) {
    const currentIgnoredUsers = await getIgnoredUsersArray();
    return !currentIgnoredUsers.includes(userID);
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
