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
 * concatenated favorites `id`, `isFavored` and `currentOffset` data
 *
 * @param ctx Context object to get session data
 * @returns Current menu identificator
 */
export function getMenuIdentificator(ctx: BotContext) {
    return ctx.session.currentFavorites
        ?.map(({ id, isFavored }) => `${id}-${isFavored}`)
        .join("|")
        .concat(String(ctx.session.currentOffset)) ?? "";
}

/**
 * Handles exception for close menu handler
 *
 * @param ctx Context object to get message data
 */
export async function closeMenuExceptionHandler(ctx: BotContext) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToDelete");
    if (!messageId) {
        return void await ctx.reply(replyText);
    }

    await ctx.reply(replyText, {
        reply_parameters: {
            message_id: messageId,
        },
    });
}

/**
 * Handles exception for outdated menu handler
 *
 * @param ctx Context object to get message data
 */
export async function outdatedExceptionHandler(ctx: BotContext) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToUpdate");
    if (!messageId) {
        return void await ctx.reply(replyText);
    }

    await ctx.reply(replyText, {
        reply_parameters: { message_id: messageId },
    });
}
