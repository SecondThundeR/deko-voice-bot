import { getUserIsIgnoredStatus } from "@deko-voice-bot/database/queries/users.js";
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { prepareFavoritesSessionMenu } from "#root/bot/helpers/menu.js";
import { favoritesMenu } from "#root/bot/menu/favorites.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("favorites", logHandle("command-favorites"), async (ctx) => {
    const userIgnoreStatus = await getUserIsIgnoredStatus(ctx.from.id);

    if (userIgnoreStatus === null) {
        return ctx.reply(ctx.t("favorites-new-user"));
    } else if (userIgnoreStatus) {
        return ctx.reply(ctx.t("favorites-opted-out"));
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
