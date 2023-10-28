import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { addIgnoredUser } from "@/src/database/deko/ignoredUsers/addIgnoredUser.ts";

const optOutCommand = new Composer();

const { failedToFindUserData, addIgnore: { success, failed, exception } } =
    locale.frontend;

optOutCommand.command("optout", async (ctx) => {
    const currentUserID = ctx.from?.id;
    if (!currentUserID) return await ctx.reply(failedToFindUserData);

    try {
        const lastUserData = await addIgnoredUser(currentUserID);
        return !lastUserData
            ? await ctx.reply(failed)
            : await ctx.reply(success(lastUserData), {
                parse_mode: "HTML",
            });
    } catch (error) {
        console.log(
            `Failed process opt out for "${currentUserID}": ${
                (error as Error).message
            }`,
        );
        return await ctx.reply(exception);
    }
});

export { optOutCommand };
