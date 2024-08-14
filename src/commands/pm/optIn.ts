import { Composer } from "grammy";

import { markUserAsNotIgnored } from "@/drizzle/queries/update";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import { extractUserDetails } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    if (!userDetails) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const optInStatus = await markUserAsNotIgnored(userDetails);
    if (!optInStatus) {
        return await ctx.reply(ctx.t("optin.failed"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    await ctx.reply(ctx.t("optin.success"));
});
