import { Composer } from "@/deps.ts";

import { extractUserDetails } from "@/src/helpers/api.ts";
import {
    extractOtherUserData,
    getUserIgnoreStatus,
} from "@/src/helpers/cache.ts";
import { getUserDataMessageText } from "@/src/helpers/locale.ts";

import type { BotContext } from "@/src/types/bot.ts";

/**
 * To save cache size and reduce queries to DB,
 * this command will extract user's ID, fullName and username from
 * message object and only will deal with getting usage amount
 */
export const myDataCommand = new Composer<BotContext>();

myDataCommand.command("mydata", async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    if (!userDetails) {
        return await ctx.reply(ctx.t("general.failedToFindUserData"));
    }

    const userIgnoreStatus = await getUserIgnoreStatus(userDetails.userID);
    if (userIgnoreStatus) {
        return await ctx.reply(ctx.t("myData.ignoredUser"));
    }

    const { userID } = userDetails;
    const otherData = await extractOtherUserData(userID);
    const replyText = getUserDataMessageText(ctx, {
        ...userDetails,
        ...otherData,
    });

    await ctx.reply(replyText, {
        parse_mode: "HTML",
    });
});
