import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { removeIgnoredUser } from "@/src/database/deko/ignoredUsers/removeIgnoredUser.ts";

const optInCommand = new Composer();

const { failedToFindUserData, removeIgnore: { success, failed } } =
    locale.frontend;

optInCommand.command("optin", async (ctx) => {
    const currentUserID = ctx.from?.id;
    if (!currentUserID) return await ctx.reply(failedToFindUserData);

    const removeIgnoreStatus = await removeIgnoredUser(currentUserID);
    return await ctx.reply(removeIgnoreStatus ? success : failed);
});

export { optInCommand };
