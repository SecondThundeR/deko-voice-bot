import { Composer } from "grammy";
import { getUserIsIgnoredStatus } from "@/drizzle/queries/select";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { prepareFavoritesSessionMenu } from "../helpers/menu";
import { favoritesMenu } from "../menu/favorites";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("favorites", logHandle("command-favorites"), async (ctx) => {
    const userID = ctx.from.id;
    const userIgnoreStatus = await getUserIsIgnoredStatus(userID);
    if (userIgnoreStatus === null)
        return await ctx.reply(ctx.t("favorites.newUser"));
    if (userIgnoreStatus) return await ctx.reply(ctx.t("favorites.optout"));

    const prepareStatus = await prepareFavoritesSessionMenu(ctx, userID);
    if (!prepareStatus) return await ctx.reply(ctx.t("favorites.noData"));

    await ctx.reply(ctx.t("favorites.header"), { reply_markup: favoritesMenu });
});

export { composer as favoritesFeature };
