import { Composer } from "grammy";

import { deleteAllUserFavoritesQuery } from "@/drizzle/prepared/usersFavorites";
import { markUserAsIgnored } from "@/drizzle/queries/update";

import { getFormattedUserData } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";
import { getUserDataQuery } from "@/drizzle/prepared/users";

export const optOutCommand = new Composer<BotContext>();

optOutCommand.command("optout", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const userId = ctx.from.id;
    const [lastUserData] = await getUserDataQuery.execute({ userId });
    if (!lastUserData) return await ctx.reply(ctx.t("optout.failed"));

    await markUserAsIgnored(userId);
    await deleteAllUserFavoritesQuery.execute({ userId });

    await ctx.reply(
        ctx.t("optout.success", getFormattedUserData(lastUserData)),
        {
            parse_mode: "HTML",
        },
    );
});
