import { Composer } from "grammy";
import { optInUser } from "@/drizzle/queries/users";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { extractUserDetails } from "../helpers/user";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optin", logHandle("command-optin"), async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    const optInStatus = await optInUser(userDetails);

    if (optInStatus === "newUser") {
        return await ctx.reply(ctx.t(`optin.newUser`));
    }
    if (optInStatus === "restored") {
        return await ctx.reply(ctx.t("optin.success"));
    }
    return await ctx.reply(ctx.t("optin.alreadyOptedIn"));
});

export { composer as optinFeature };
