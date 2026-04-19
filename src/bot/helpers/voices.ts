import { getVoices } from "@/drizzle/queries/select";
import type { FavoriteVoicesIds } from "@/drizzle/types";

import type { InlineQueriesArray, InlineResultVoice } from "../types/inline";

import { convertVoiceDataToQueriesArray } from "./inline-query";

export function filterFavoriteVoices(
    data: InlineResultVoice[],
    favoritesIds: FavoriteVoicesIds,
) {
    if (favoritesIds.length === 0) return data;

    const favoriteVoices = data
        .filter((voice) => favoritesIds.includes(voice.id))
        .map((voice) => ({
            ...voice,
            title: `⭐️ ${voice.title}`,
        }));
    const regularVoices = data.filter(
        (voice) => !favoritesIds.includes(voice.id),
    );

    return [...favoriteVoices, ...regularVoices];
}

export async function getVoiceQueries(
    queryString = "",
    favoritesIds: FavoriteVoicesIds = [],
) {
    const latestVoices = await getVoices(queryString);
    const convertedVoiceQueries = convertVoiceDataToQueriesArray(latestVoices);

    return filterFavoriteVoices(
        convertedVoiceQueries,
        favoritesIds,
    ) as InlineQueriesArray;
}
