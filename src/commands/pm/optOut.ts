import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { addIgnoredUser } from "@/src/database/deko/ignoredUsers/addIgnoredUser.ts";

const optOutCommand = new Composer();

const { failedToFindUserData, addIgnore: { success, failed, exception } } =
    locale.frontend;

optOutCommand.command("optout", async (ctx) => {
    if (!ctx.from) return await ctx.reply(failedToFindUserData);

    const currentUserID = ctx.from.id;
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
        return await ctx.reply(exception, {
            reply_markup: sendInlineRequestKeyboard,
        });
    }
});

export { optOutCommand };
