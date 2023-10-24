import { InlineQueryResultVoice } from "@/deps.ts";

import { rootQueryCache } from "@/src/cache/rootQuery.ts";
import { textQueryCache } from "@/src/cache/textQuery.ts";
import { rootCacheKey } from "@/src/constants/cache.ts";

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
