import { getVoicesPage } from "@/drizzle/queries/select";
import type { SelectUser } from "@/drizzle/schema";

import type { InlineQueriesArray } from "../types/inline";

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
