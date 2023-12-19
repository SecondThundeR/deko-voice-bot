import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";
import { locale } from "@/src/constants/locale.ts";

import { addIgnoredUser } from "@/src/database/deko/ignoredUsers/addIgnoredUser.ts";
import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

const optOutCommand = new Composer();

const {
    failedToFindUserData,
    addIgnore: { success, failed, exception },
    maintenance: { pmText },
} = locale.frontend;

optOutCommand.command("optout", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    if (isInMaintenance) return await ctx.reply(pmText);

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
