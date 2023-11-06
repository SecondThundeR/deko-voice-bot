import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";
import {
    extractOtherUserData,
    getUserIgnoreStatus,
} from "@/src/helpers/cache.ts";

/**
 * To save cache size and reduce queries to DB,
 * this command will extract user's ID, fullName and username from
 * message object and only will deal with getting usage amount
 */
const myDataCommand = new Composer();

const { failedToFindUserData, noDataForIgnoredUser, userDataMessage } =
    locale.frontend;

myDataCommand.command("mydata", async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    if (!userDetails) {
        return await ctx.reply(failedToFindUserData);
    }

    const userIgnoreStatus = await getUserIgnoreStatus(userDetails.userID);
    if (userIgnoreStatus) return await ctx.reply(noDataForIgnoredUser);

    const userID = userDetails.userID;
    const otherData = await extractOtherUserData(userID);

    return await ctx.reply(
        userDataMessage(userDetails, otherData),
        {
            parse_mode: "HTML",
        },
    );
});

export { myDataCommand };
