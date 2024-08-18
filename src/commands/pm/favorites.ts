import { Composer } from "grammy";

import { getUserIsIgnoredStatus } from "@/drizzle/queries/select";

import { prepareFavoritesSessionMenu } from "@/src/helpers/menu";

import { favoritesMenu } from "@/src/menu/favorites";

import type { BotContext } from "@/src/types/bot";

export const favoritesCommand = new Composer<BotContext>();

favoritesCommand.command("favorites", async (ctx) => {
    const userID = ctx.from?.id;
    if (!userID) return await ctx.reply(ctx.t("general.failedToGetUserData"));

    const userIgnoreStatus = await getUserIsIgnoredStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(ctx.t("favorites.optout"));

    const prepareStatus = await prepareFavoritesSessionMenu(ctx, userID);
    if (!prepareStatus) return await ctx.reply(ctx.t("favorites.noData"));

    await ctx.reply(ctx.t("favorites.header"), { reply_markup: favoritesMenu });
});
