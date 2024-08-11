import { Composer } from "grammy";

import { getUserIgnoreStatus } from "@/src/helpers/cache";
import { prepareFavoritesSessionMenu } from "@/src/helpers/menu";

import { favoritesMenu } from "@/src/menu/favorites";

import type { BotContext } from "@/src/types/bot";

export const favoritesCommand = new Composer<BotContext>();

favoritesCommand.command("favorites", async (ctx) => {
    const userID = ctx.from?.id;
    if (!userID) return await ctx.reply(ctx.t("general.failedToGetUserData"));

    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(ctx.t("favorites.optout"));

    const status = await prepareFavoritesSessionMenu(ctx, userID);
    if (!status) return await ctx.reply(ctx.t("favorites.noData"));

    await ctx.reply(ctx.t("favorites.header"), { reply_markup: favoritesMenu });
});
