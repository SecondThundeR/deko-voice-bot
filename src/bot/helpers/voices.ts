import { getVoices, getVoicesPage } from "@/drizzle/queries/select";
import type { SelectUser } from "@/drizzle/schema";
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

export async function getVoiceQueriesPage({
    favoritesUserId,
    limit,
    offset,
    queryString = "",
}: {
    favoritesUserId?: SelectUser["userId"];
    limit: number;
    offset: number;
    queryString?: string;
}) {
    const voicesPage = await getVoicesPage({
        favoritesUserId,
        limit,
        offset,
        query: queryString,
    });

    return voicesPage.map(
        ({ isFavorite, voiceId: id, voiceTitle, fileId: voice_file_id }) =>
            ({
                type: "voice",
                id,
                title: isFavorite ? `⭐️ ${voiceTitle}` : voiceTitle,
                voice_file_id,
            }) as const,
    ) as InlineQueriesArray;
}
