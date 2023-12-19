import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";

import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";
import { prepareFavoritesSessionMenu } from "@/src/helpers/menu.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";

import { BotContext } from "@/src/types/bot.ts";

const favoritesCommand = new Composer<BotContext>();

const {
    failedToFindUserData,
    favorites: { header, optout },
    maintenance: { pmText },
} = locale.frontend;

favoritesCommand.command("favorites", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    if (isInMaintenance) return await ctx.reply(pmText);

    if (!ctx.from) return await ctx.reply(failedToFindUserData);
    const userID = ctx.from.id;

    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) return await ctx.reply(optout);

    await prepareFavoritesSessionMenu(ctx, userID);

    return await ctx.reply(header, { reply_markup: favoritesMenu });
});

export { favoritesCommand };
