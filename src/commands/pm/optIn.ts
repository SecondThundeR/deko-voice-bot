import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { locale } from "@/src/constants/locale.ts";

import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/usersData/isUserUsageExists.ts";
import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

const optInCommand = new Composer();

const {
    failedToFindUserData,
    removeIgnore: { success, failed, exception },
    maintenance: { pmText },
} = locale.frontend;

optInCommand.command("optin", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    if (isInMaintenance) return await ctx.reply(pmText);

    if (!ctx.from) return await ctx.reply(failedToFindUserData);

    const currentUserID = ctx.from.id;
    const removeIgnoreStatus = await removeIgnoredUser(ctx.from);
    const isUserDataExists = await isUserUsageExists(currentUserID);

    if (!isUserDataExists && !removeIgnoreStatus) {
        return await ctx.reply(exception, {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    return await ctx.reply(removeIgnoreStatus ? success : failed);
});

export { optInCommand };
