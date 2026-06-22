import { getVoicesPage } from "#drizzle/queries/select.js";
import type { SelectUser } from "#drizzle/schema.js";

import type { InlineQueriesArray } from "#root/bot/types/inline.js";

type GetVoiceQueriesPageOptions = {
    favoritesUserId?: SelectUser["userId"];
    limit: number;
    offset: number;
    queryString?: string;
};

export async function getVoiceQueriesPage({
    favoritesUserId,
    limit,
    offset,
    queryString = "",
}: GetVoiceQueriesPageOptions) {
    const voicesPage = await getVoicesPage({
        favoritesUserId,
        limit,
        offset,
        orderFavoritesFirst: Boolean(favoritesUserId),
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
