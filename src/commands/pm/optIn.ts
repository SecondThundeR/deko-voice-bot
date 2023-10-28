import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/stats/isUserUsageExists.ts";

const optInCommand = new Composer();

const { failedToFindUserData, removeIgnore: { success, failed, exception } } =
    locale.frontend;

optInCommand.command("optin", async (ctx) => {
    const currentUserID = ctx.from?.id;
    if (!currentUserID) return await ctx.reply(failedToFindUserData);

    const removeIgnoreStatus = await removeIgnoredUser(currentUserID);
    const isUserDataExists = await isUserUsageExists(currentUserID);
    if (!isUserDataExists && !removeIgnoreStatus) {
        return await ctx.reply(exception, {
            reply_markup: sendInlineRequestKeyboard,
        });
    }

    return await ctx.reply(removeIgnoreStatus ? success : failed);
});

export { optInCommand };
