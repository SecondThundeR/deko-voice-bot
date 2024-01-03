import { getFavoriteVoiceStatus } from "@/src/helpers/cache.ts";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices.ts";

import { BotContext } from "@/src/types/bot.ts";

/**
 * Prepares context session for favorites menu launch
 *
 * @param ctx Context object to access session data
 * @param userID ID of user to get favorite status
 */
export async function prepareFavoritesSessionMenu(
    ctx: BotContext,
    userID: number,
) {
    const voicesData = await getCurrentVoiceQueriesData();
    if (!voicesData) {
        ctx.session.currentFavorites = null;
        return;
    }

    const newFavoritesData = await Promise.all(
        voicesData.map(async ({ id, title }) => {
            const isFavored = await getFavoriteVoiceStatus(userID, id);
            return { id, title, isFavored };
        }),
    );

    ctx.session.currentFavorites = newFavoritesData;
}

/**
 * Returns current menu identificator to ensure that it is up to date
 *
 * @description Menu identificator consists of
 * concatenated favorites `id` and `isFavored` data
 *
 * @param ctx Context object to get session data
 * @returns Current menu identificator
 */
export function getMenuIdentificator(ctx: BotContext) {
    return ctx.session.currentFavorites?.map((data) =>
        `${data.id}-${data.isFavored}`
    ).join("|") ?? "";
}
