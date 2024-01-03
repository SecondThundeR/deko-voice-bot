import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";

import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";
import { prepareFavoritesSessionMenu } from "@/src/helpers/menu.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";

import type { BotContext } from "@/src/types/bot.ts";

const {
    failedToFindUserData,
    favorites: { header, optout },
    maintenance: { pmText },
} = locale.frontend;

export const favoritesCommand = new Composer<BotContext>();

favoritesCommand.command("favorites", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    if (isInMaintenance) return await ctx.reply(pmText);

    const userID = ctx.from?.id;
    if (!userID) return await ctx.reply(failedToFindUserData);

    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(optout);

    await prepareFavoritesSessionMenu(ctx, userID);
    await ctx.reply(header, { reply_markup: favoritesMenu });
});
