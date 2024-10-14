import { getVoices } from "@/drizzle/queries/select";
import type { FavoriteVoicesIds } from "@/drizzle/types";

import { FAVORITE_EMOJI } from "@/src/constants/locale";

import type { InlineQueriesArray, InlineResultVoice } from "@/src/types/inline";

import { convertVoiceDataToQueriesArray } from "./inlineQuery";

export function filterFavoriteVoices(
    data: InlineResultVoice[],
    favoritesIds: FavoriteVoicesIds,
) {
    if (favoritesIds.length === 0) return data;

    const favoriteVoices = data
        .filter((voice) => favoritesIds.includes(voice.id))
        .map((voice) => ({
            ...voice,
            title: `${FAVORITE_EMOJI} ${voice.title}`,
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
