import { getFavoriteVoiceStatus } from "@/src/helpers/cache.ts";
import { BotContext, FavoriteItem } from "@/src/types/bot.ts";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices.ts";

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

    ctx.session.currentFavorites = voicesData.map(({ id, title }) => {
        const isFavored = getFavoriteVoiceStatus(userID, id);
        return { id, title, isFavored } satisfies FavoriteItem;
    });

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
