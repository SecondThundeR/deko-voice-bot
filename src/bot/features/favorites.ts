import { Composer } from "grammy";
import { getUserData } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { prepareFavoritesSessionMenu } from "#root/bot/helpers/menu.js";
import { favoritesMenu } from "#root/bot/menu/favorites.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("favorites", logHandle("command-favorites"), async (ctx) => {
    const userData = await getUserData(ctx.from.id);

    if (!userData) {
        return ctx.reply(ctx.t("favorites-new-user"));
    }

    const prepareStatus = await prepareFavoritesSessionMenu(ctx);
    if (!prepareStatus) {
        return ctx.reply(ctx.t("favorites-no-data"));
    }

    return ctx.reply(ctx.t("favorites-header"), {
        reply_markup: favoritesMenu,
    });
});

export { composer as favoritesFeature };
