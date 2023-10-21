import { type InlineQueryResultVoice } from "@/deps.ts";

import { getVoices } from "@/src/database/getVoices.ts";
import { rootQueryCache, textQueryCache } from "@/src/handlers/inlineQuery.ts";
import { type VoiceSchema } from "@/src/schemas/voice.ts";
import { convertGoogleDriveLink } from "@/src/helpers/general.ts";

import { rootCacheKey } from "@/src/constants.ts";

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
 * @param queryString String to filter out voices
 * @returns Array of voice queries
*/
export async function getCurrentVoiceQueriesData(queryString: string) {
  const formattedQueryString = queryString.toLocaleLowerCase();
  const isSearchingByQuery = formattedQueryString.length > 0;

  // Cache check
  // TODO(@secondthunder): Refactor to two different functions
  if (isSearchingByQuery) {
    if (textQueryCache.has(formattedQueryString))
      return [...textQueryCache.get(formattedQueryString)!];

    if (rootQueryCache.has(rootCacheKey)) {
      const filteredQueries = [...rootQueryCache.get(rootCacheKey)!].filter(
        (query) =>
          query.title.toLocaleLowerCase().includes(formattedQueryString)
      );
      textQueryCache.set(formattedQueryString, filteredQueries);
      return filteredQueries;
    }
  } else {
    if (rootQueryCache.has(rootCacheKey))
      return [...rootQueryCache.get(rootCacheKey)!];
  }

  // DB fetch
  // (Setting only in root, as there is no way, user can skip root cache update)
  const voices = await getVoices(formattedQueryString);
  const voicesQueries = convertVoiceDataToQueriesArray(voices);

  rootQueryCache.set(rootCacheKey, voicesQueries);
  return voicesQueries;
}

/**
 * Converts array of voices data to array of inline query data
 *
 * @param voicesData Array of voices from DB
 * @returns Converted array, suitable for inline query
 */
export function convertVoiceDataToQueriesArray(
  voicesData: VoiceSchema[]
): InlineQueryResultVoice[] {
  return voicesData.map((data) => {
    const { id, title, url } = data;
    const voice_url = convertGoogleDriveLink(url);
    return {
      type: "voice",
      id,
      title,
      voice_url,
    };
  });
}
