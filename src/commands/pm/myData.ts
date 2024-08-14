import { Composer } from "grammy";

import { getUserDataQuery } from "@/drizzle/prepared/users";

import { getFormattedUserData } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";

export const myDataCommand = new Composer<BotContext>();

myDataCommand.command("mydata", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const [userData] = await getUserDataQuery.execute({ userId });
    if (!userData) {
        return await ctx.reply(ctx.t("myData.noData"));
    }

    await ctx.reply(
        ctx.t("myData.dataMessage", getFormattedUserData(userData)),
        {
            parse_mode: "HTML",
        },
    );
});
