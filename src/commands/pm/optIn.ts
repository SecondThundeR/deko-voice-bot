import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { locale } from "@/src/constants/locale.ts";

import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/usersData/isUserUsageExists.ts";
import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

const {
    failedToFindUserData,
    removeIgnore: { success, failed, exception },
    maintenance: { pmText },
} = locale.frontend;

export const optInCommand = new Composer();

optInCommand.command("optin", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);

    if (isInMaintenance) return await ctx.reply(pmText);
    if (!ctx.from) return await ctx.reply(failedToFindUserData);

    const currentUserID = ctx.from.id;
    const isUserDataExists = await isUserUsageExists(currentUserID);
    const removeIgnoreStatus = await removeIgnoredUser(ctx.from);
    const isExceptionTriggered = !isUserDataExists && !removeIgnoreStatus;

    if (isExceptionTriggered) {
        return await ctx.reply(exception, {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    await ctx.reply(removeIgnoreStatus ? success : failed);
});
