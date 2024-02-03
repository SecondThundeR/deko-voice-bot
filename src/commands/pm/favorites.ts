import { Composer } from "@/deps.ts";

import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";
import { prepareFavoritesSessionMenu } from "@/src/helpers/menu.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const favoritesCommand = new Composer<BotContext>();

favoritesCommand.command("favorites", async (ctx) => {
    const userID = ctx.from?.id;
    if (!userID) return await ctx.reply(ctx.t("general.failedToFindUserData"));

    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(ctx.t("favorites.optout"));

    const status = await prepareFavoritesSessionMenu(ctx, userID);
    if (!status) return await ctx.reply(ctx.t("favorites.noData"));
    await ctx.reply(ctx.t("favorites.header"), { reply_markup: favoritesMenu });
});
