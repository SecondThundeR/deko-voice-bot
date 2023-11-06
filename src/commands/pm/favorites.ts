import { Composer } from "@/deps.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";
import { BotContext } from "@/src/types/bot.ts";
import { prepareFavoritesSessionMenu } from "@/src/helpers/menu.ts";
import { locale } from "@/src/constants/locale.ts";
import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";

const favoritesCommand = new Composer<BotContext>();

const { failedToFindUserData, favorites: { header, optout } } = locale.frontend;

favoritesCommand.command("favorites", async (ctx) => {
    if (!ctx.from) return await ctx.reply(failedToFindUserData);
    const userID = ctx.from.id;

    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(optout);

    await prepareFavoritesSessionMenu(ctx, userID);

    return await ctx.reply(header, { reply_markup: favoritesMenu });
});

export { favoritesCommand };
