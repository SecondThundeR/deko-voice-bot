import { Composer } from "grammy";

import { getLastUsedAtTime } from "@/src/database/general/usersData/getLastUsedAtTime";
import { getUserUsageAmount } from "@/src/database/general/usersData/getUserUsageAmount";

import { extractUserDetails } from "@/src/helpers/api";
import { getUserIgnoreStatus } from "@/src/helpers/cache";
import { getUserDataMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

/**
 * To save cache size and reduce queries to DB,
 * this command will extract user's ID, fullName and username from
 * message object and only will deal with getting usage amount
 *
 * If caching is disabled, command will trigger DB query on each execution
 */
export const myDataCommand = new Composer<BotContext>();

myDataCommand.command("mydata", async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    if (!userDetails) {
        return await ctx.reply(ctx.t("general.failedToGetUserData"));
    }

    const { userID } = userDetails;
    const userIgnoreStatus = await getUserIgnoreStatus(userID);
    if (userIgnoreStatus) {
        return await ctx.reply(ctx.t("myData.ignoredUser"));
    }

    const usesAmount = await getUserUsageAmount(userID);
    const lastUsedAt = await getLastUsedAtTime(userID);
    const replyText = getUserDataMessageText(ctx, {
        ...userDetails,
        usesAmount,
        lastUsedAt,
    });

    await ctx.reply(replyText, {
        parse_mode: "HTML",
    });
});
