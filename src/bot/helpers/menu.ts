import { getVoicesCount, getVoicesPage } from "@/drizzle/queries/select";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "../constants/inline";
import type { Context } from "../context";
import type { FavoriteItem } from "../types/favorite-item";
import type { InlineResultVoice } from "../types/inline";
import { getVoiceQueriesPage } from "./voices";

export async function prepareFavoritesSessionMenu(ctx: Context) {
    const voicesCount = await getVoicesCount();
    if (voicesCount === 0) {
        return false;
    }

    ctx.session.currentFavoritesOffset = 0;
    return true;
}

export async function getFavoritesMenuPage(
    ctx: Context,
    userID: number,
): Promise<FavoriteItem[]> {
    const voicesPage = await getVoicesPage({
        favoritesUserId: userID,
        limit: MAX_MENU_ELEMENTS_PER_PAGE,
        offset: ctx.session.currentFavoritesOffset,
    });

    return voicesPage.map(({ isFavorite, voiceId: id, voiceTitle: title }) => ({
        id,
        title,
        isFavored: isFavorite,
    }));
}

export async function getFavoritesMenuIdentificator(ctx: Context) {
    const userID = ctx.from?.id;
    if (!userID) {
        return "";
    }

    const favoritesPage = await getFavoritesMenuPage(ctx, userID);

    return favoritesPage
        .map(({ id, isFavored }) => `${id}-${isFavored}`)
        .join("|")
        .concat(String(ctx.session.currentFavoritesOffset));
}

export async function prepareVoicesSessionMenu(ctx: Context) {
    const voicesCount = await getVoicesCount();
    if (voicesCount === 0) {
        return false;
    }

    ctx.session.currentVoice = null;
    ctx.session.currentVoicesOffset = 0;
    return true;
}

export async function getVoicesMenuPage(
    ctx: Context,
): Promise<InlineResultVoice[]> {
    return getVoiceQueriesPage({
        limit: MAX_MENU_ELEMENTS_PER_PAGE,
        offset: ctx.session.currentVoicesOffset,
    });
}

export async function getVoicesMenuIdentificator(ctx: Context) {
    const voicesPage = await getVoicesMenuPage(ctx);

    return voicesPage
        .map(({ id, title }) => `${id}-${title}`)
        .join("|")
        .concat(String(ctx.session.currentVoicesOffset));
}

export function getVoiceSubmenuIdentificator(ctx: Context) {
    if (!ctx.session.currentVoice) {
        return "";
    }

    const { id, title } = ctx.session.currentVoice;
    return `${id}-${title}`;
}

export async function closeMenuExceptionHandler(ctx: Context) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToDelete");
    if (!messageId) {
        return ctx.reply(replyText);
    }

    return ctx.reply(replyText, {
        reply_parameters: {
            message_id: messageId,
        },
    });
}

export async function outdatedExceptionHandler(ctx: Context) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToUpdate");
    if (!messageId) {
        return ctx.reply(replyText);
    }

    return ctx.reply(replyText, {
        reply_parameters: { message_id: messageId },
    });
}
