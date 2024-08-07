import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import { removeIgnoredUser } from "@/src/database/general/ignoredUsers/removeIgnoredUser";
import { isUserUsageExists } from "@/src/database/general/usersData/isUserUsageExists";

import type { BotContext } from "@/src/types/bot";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToFindUserData"));
    }

    const currentUserID = ctx.from.id;
    const isUserDataExists = await isUserUsageExists(currentUserID);
    const removeIgnoreStatus = await removeIgnoredUser(ctx.from);
    const isExceptionTriggered = !isUserDataExists && !removeIgnoreStatus;
    const translationPath = removeIgnoreStatus ? "success" : "failed";

    if (isExceptionTriggered) {
        return await ctx.reply(ctx.t("optin.exception"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    await ctx.reply(ctx.t(`optin.${translationPath}`));
});
