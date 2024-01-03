import { type InlineQueryResultVoice } from "@/deps.ts";

import { FAVORITE_EMOJI } from "@/src/constants/locale.ts";

import { getVoices } from "@/src/database/deko/voices/getVoices.ts";

import {
    checkQueriesCache,
    updateRootQueryCache,
    updateTextQueryCache,
} from "@/src/helpers/cache.ts";
import { convertGoogleDriveLink } from "@/src/helpers/general.ts";

import { type VoiceSchema } from "@/src/schemas/voice.ts";

/**
 * Gets current voice queries data
 *
 * @description
 * Method tries to minimize queries to main MongoDB by caching some parts in local TTL cache
 *
 * Main cache saves data for longer period
 (when needed to clear right away, there are built-in invalidate command for creator)
 *
 * Text query cache saves queries for certain string for a shorter period of time, not to waste too many space.
 * This helps to reduce calls for DB when searching for specific voice (also, it doesn't calls DB on scrolling)
 *
 * Also, when `favoritesIds` is passed and `queryString` is empty, method will return filtered array of voices,
 * so favored voices will be at the top of list
 *
 * @param queryString String to filter out voices
 * @param favoritesIds Ids of favorite users voices
 * @returns Array of voice queries
*/
export async function getCurrentVoiceQueriesData(
    queryString = "",
    favoritesIds?: string[],
) {
    const isQueryTextPassed = queryString.length > 0;
    const lowercasedQueryText = queryString.toLocaleLowerCase();
    const cachedQueries = checkQueriesCache(lowercasedQueryText);

    if (cachedQueries) {
        return isQueryTextPassed
            ? cachedQueries
            : filterFavoriteVoices(cachedQueries, favoritesIds);
    }

    const latestVoices = await getVoices(lowercasedQueryText);
    const convertedVoiceQueries = convertVoiceDataToQueriesArray(latestVoices);

    if (isQueryTextPassed) {
        updateTextQueryCache(lowercasedQueryText, convertedVoiceQueries);
        return convertedVoiceQueries;
    }

    updateRootQueryCache(convertedVoiceQueries);
    return filterFavoriteVoices(convertedVoiceQueries, favoritesIds);
}

/**
 * Converts array of voices data to array of inline query data
 *
 * @param voicesData Array of voices from DB
 * @returns Converted array, suitable for inline query usage
 */
export function convertVoiceDataToQueriesArray(
    voicesData: VoiceSchema[],
): InlineQueryResultVoice[] {
    return voicesData.map(({ id, title, url }) => {
        const voice_url = convertGoogleDriveLink(url);
        return {
            type: "voice",
            id,
            title,
            voice_url,
        };
    });
}

/**
 * Filters voice queries based on passed favorites Ids array
 *
 * If favorites array is empty, returns data as is
 *
 * @param data Array of voice inline queries
 * @param favoritesIds Array of favorite voice Ids
 * @returns Filtered or non-filtered query array
 */
export function filterFavoriteVoices(
    data: InlineQueryResultVoice[],
    favoritesIds?: string[],
) {
    if (!favoritesIds) return data;

    const favoriteVoices = data
        .filter((voice) => favoritesIds.includes(voice.id))
        .map((voice) => ({
            ...voice,
            title: `${FAVORITE_EMOJI} ${voice.title}`,
        }));
    const regularVoices = data.filter((voice) =>
        !favoritesIds.includes(voice.id)
    );

    return [...favoriteVoices, ...regularVoices];
}
