import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";
import { isUserUsageExists } from "@/src/database/deko/usersData/isUserUsageExists.ts";

const optInCommand = new Composer();

const { failedToFindUserData, removeIgnore: { success, failed, exception } } =
    locale.frontend;

optInCommand.command("optin", async (ctx) => {
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
