import { getUserFavorites } from "@/drizzle/queries/select";

import { getVoiceQueries } from "@/src/helpers/voices";

import type { BotContext } from "@/src/types/bot";

export async function prepareFavoritesSessionMenu(
    ctx: BotContext,
    userID: number,
) {
    const voicesData = await getVoiceQueries();
    if (voicesData.length === 0) {
        ctx.session.currentFavorites = null;
        return false;
    }

    const userFavorites = await getUserFavorites(userID);
    const newFavoritesData = voicesData.map(({ id, title }) => ({
        id,
        title,
        isFavored: userFavorites.includes(id),
    }));

    ctx.session.currentFavoritesOffset = 0;
    ctx.session.currentFavorites = newFavoritesData;
    return true;
}

export function getFavoritesMenuIdentificator(ctx: BotContext) {
    return (
        ctx.session.currentFavorites
            ?.map(({ id, isFavored }) => `${id}-${isFavored}`)
            .join("|")
            .concat(String(ctx.session.currentFavoritesOffset)) ?? ""
    );
}

export async function prepareVoicesSessionMenu(ctx: BotContext) {
    const voicesData = await getVoiceQueries();
    if (voicesData.length === 0) {
        ctx.session.currentVoices = null;
        return false;
    }

    ctx.session.currentVoice = null;
    ctx.session.currentVoices = voicesData;
    ctx.session.currentVoicesOffset = 0;
    return true;
}

export function getVoicesMenuIdentificator(ctx: BotContext) {
    return (
        ctx.session.currentVoices
            ?.map(({ id, title }) => `${id}-${title}`)
            .join("|")
            .concat(String(ctx.session.currentVoicesOffset)) ?? ""
    );
}

export function getVoiceSubmenuIdentificator(ctx: BotContext) {
    if (!ctx.session.currentVoice) return "";

    const { id, title } = ctx.session.currentVoice;
    return `${id}-${title}`;
}

export async function closeMenuExceptionHandler(ctx: BotContext) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToDelete");
    if (!messageId) {
        return await ctx.reply(replyText);
    }

    await ctx.reply(replyText, {
        reply_parameters: {
            message_id: messageId,
        },
    });
}

export async function outdatedExceptionHandler(ctx: BotContext) {
    const messageId = ctx.msg?.message_id;
    const replyText = ctx.t("menu.failedToUpdate");
    if (!messageId) {
        return await ctx.reply(replyText);
    }

    await ctx.reply(replyText, {
        reply_parameters: { message_id: messageId },
    });
}
