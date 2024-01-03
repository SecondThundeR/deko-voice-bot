import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/usersData/isUserUsageExists.ts";
import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const optInCommand = new Composer<BotContext>();

optInCommand.command("optin", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);

    if (isInMaintenance) {
        return await ctx.reply(ctx.t("maintenance.description-chat"));
    }
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
