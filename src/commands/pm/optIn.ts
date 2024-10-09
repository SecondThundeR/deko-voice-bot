import { Composer } from "grammy";

import { insertUserData } from "@/drizzle/queries/insert";
import { isUserExists } from "@/drizzle/queries/select";
import { markUserAsNotIgnored } from "@/drizzle/queries/update";

import { extractUserDetails } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    if (!userDetails) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const isExists = await isUserExists(userDetails.userId);
    if (!isExists) {
        await insertUserData({ ...userDetails });
        return await ctx.reply(ctx.t(`optin.newUser`));
    }

    const optInStatus = await markUserAsNotIgnored(userDetails);
    if (optInStatus) return await ctx.reply(ctx.t("optin.success"));
    return await ctx.reply(ctx.t("optin.alreadyOptedIn"));
});
