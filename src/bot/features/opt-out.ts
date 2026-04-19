import { Composer } from "grammy";
import { getUserDataQuery } from "@/drizzle/prepared/users";
import { deleteAllUserFavoritesQuery } from "@/drizzle/prepared/usersFavorites";
import { markUserAsIgnored } from "@/drizzle/queries/update";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { getFormattedUserData } from "../helpers/user";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optout", logHandle("command-optout"), async (ctx) => {
    const userId = ctx.from.id;
    const [lastUserData] = await getUserDataQuery.execute({ userId });
    if (!lastUserData) return await ctx.reply(ctx.t("optout.failed"));

    await markUserAsIgnored(userId);
    await deleteAllUserFavoritesQuery.execute({ userId });

    await ctx.reply(
        ctx.t("optout.success", getFormattedUserData(lastUserData)),
    );
});

export { composer as optoutFeature };
