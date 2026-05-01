import { Composer } from "grammy";
import { getUserIsIgnoredStatus } from "@/drizzle/queries/select";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { prepareFavoritesSessionMenu } from "../helpers/menu";
import { favoritesMenu } from "../menu/favorites";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("favorites", logHandle("command-favorites"), async (ctx) => {
    const userIgnoreStatus = await getUserIsIgnoredStatus(ctx.from.id);

    if (userIgnoreStatus === null) {
        return ctx.reply(ctx.t("favorites.newUser"));
    } else if (userIgnoreStatus) {
        return ctx.reply(ctx.t("favorites.optout"));
    }

    const prepareStatus = await prepareFavoritesSessionMenu(ctx);
    if (!prepareStatus) {
        return ctx.reply(ctx.t("favorites.noData"));
    }

    return ctx.reply(ctx.t("favorites.header"), {
        reply_markup: favoritesMenu,
    });
});

export { composer as favoritesFeature };
