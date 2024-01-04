import { Composer } from "@/deps.ts";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/usersData/isUserUsageExists.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    if (!ctx.from) {
        return await ctx.reply(ctx.t("general.failedToFindUserData"));
    }

    const currentUserID = ctx.from.id;
    const isUserDataExists = await isUserUsageExists(currentUserID);
    const removeIgnoreStatus = await removeIgnoredUser(ctx.from);
    const isExceptionTriggered = !isUserDataExists && !removeIgnoreStatus;

    if (isExceptionTriggered) {
        return await ctx.reply(ctx.t("optin.exception"), {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    const translationPath = removeIgnoreStatus ? "success" : "failed";

    await ctx.reply(ctx.t(`optin.${translationPath}`));
});
