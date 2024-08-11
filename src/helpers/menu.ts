import { getFavoriteVoiceStatus } from "@/src/helpers/cache";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices";

import type { BotContext } from "@/src/types/bot";

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
    if (!voicesData || voicesData.length === 0) {
        ctx.session.currentFavorites = null;
        return false;
    }

    const newFavoritesData = await Promise.all(
        voicesData.map(async ({ id, title }) => {
            const isFavored = await getFavoriteVoiceStatus(userID, id);
            return { id, title, isFavored };
        }),
    );

    ctx.session.currentFavoritesOffset = 0;
    ctx.session.currentFavorites = newFavoritesData;
    return true;
}

/**
 * Returns current favorites menu identificator to ensure
 * that it is up to date
 *
 * @description Menu identificator consists of
 * concatenated favorites `id`, `isFavored` and `currentFavoritesOffset` data
 *
 * @param ctx Context object to get session data
 * @returns Current menu identificator
 */
export function getFavoritesMenuIdentificator(ctx: BotContext) {
    return (
        ctx.session.currentFavorites
            ?.map(({ id, isFavored }) => `${id}-${isFavored}`)
            .join("|")
            .concat(String(ctx.session.currentFavoritesOffset)) ?? ""
    );
}

/**
 * Prepares context session for voices menu launch
 *
 * @param ctx Context object to access session data
 */
export async function prepareVoicesSessionMenu(ctx: BotContext) {
    const voicesData = await getCurrentVoiceQueriesData();
    if (!voicesData || voicesData.length === 0) {
        ctx.session.currentVoices = null;
        return false;
    }

    ctx.session.currentVoice = null;
    ctx.session.currentVoices = voicesData;
    ctx.session.currentVoicesOffset = 0;
    return true;
}

/**
 * Returns current voices menu identificator to ensure
 * that it is up to date
 *
 * @description Menu identificator consists of
 * concatenated voices `id`, `title` and `currentVoicesOffset` data
 *
 * @param ctx Context object to get session data
 * @returns Current menu identificator
 */
export function getVoicesMenuIdentificator(ctx: BotContext) {
    return (
        ctx.session.currentVoices
            ?.map(({ id, title }) => `${id}-${title}`)
            .join("|")
            .concat(String(ctx.session.currentVoicesOffset)) ?? ""
    );
}

/**
 * Returns current voice submenu identificator to ensure
 * that it is up to date
 *
 * @description Submenu identificator consists of
 * concatenated voice `id` and `title` data
 *
 * @param ctx Context object to get session data
 * @returns Current submenu identificator
 */
export function getVoiceSubmenuIdentificator(ctx: BotContext) {
    if (!ctx.session.currentVoice) return "";

    const { id, title } = ctx.session.currentVoice;
    return `${id}-${title}`;
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
        await ctx.reply(replyText);
        return;
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
        await ctx.reply(replyText);
        return;
    }

    await ctx.reply(replyText, {
        reply_parameters: { message_id: messageId },
    });
}
