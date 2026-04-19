import { Composer } from "grammy";
import { insertUserData } from "@/drizzle/queries/insert";
import { isUserExists } from "@/drizzle/queries/select";
import { markUserAsNotIgnored } from "@/drizzle/queries/update";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { extractUserDetails } from "../helpers/user";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optin", logHandle("command-optin"), async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    const isExists = await isUserExists(userDetails.userId);
    if (!isExists) {
        await insertUserData({ ...userDetails });
        return await ctx.reply(ctx.t(`optin.newUser`));
    }

    const optInStatus = await markUserAsNotIgnored(userDetails);
    if (optInStatus) return await ctx.reply(ctx.t("optin.success"));
    return await ctx.reply(ctx.t("optin.alreadyOptedIn"));
});

export { composer as optinFeature };
