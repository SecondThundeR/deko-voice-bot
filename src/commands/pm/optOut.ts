import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { addIgnoredUser } from "@/src/database/deko/ignoredUsers/addIgnoredUser.ts";

const optOutCommand = new Composer();

const { failedToFindUserData, addIgnore: { success, failed } } =
    locale.frontend;

optOutCommand.command("optout", async (ctx) => {
    const currentUserID = ctx.from?.id;
    if (!currentUserID) return await ctx.reply(failedToFindUserData);

    const addIgnoreStatus = await addIgnoredUser(currentUserID);
    return await ctx.reply(addIgnoreStatus ? success : failed);
});

export { optOutCommand };
