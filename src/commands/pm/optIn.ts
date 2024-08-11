import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import { removeIgnoredUser } from "@/src/database/general/ignoredUsers/removeIgnoredUser";
import { isUserUsageExists } from "@/src/database/general/usersData/isUserUsageExists";

import type { BotContext } from "@/src/types/bot";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const isUserDataExists = await isUserUsageExists(ctx.from.id);
    const removeIgnoreStatus = await removeIgnoredUser(ctx.from);

    if (!isUserDataExists && !removeIgnoreStatus) {
        return await ctx.reply(ctx.t("optin.error"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    const translationPath = removeIgnoreStatus ? "success" : "failed";
    await ctx.reply(ctx.t(`optin.${translationPath}`));
});
