import { Composer } from "grammy";

import { extractUserDetails } from "@/src/helpers/api";
import { extractOtherUserData, getUserIgnoreStatus } from "@/src/helpers/cache";
import { getUserDataMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

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
