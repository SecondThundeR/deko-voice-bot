import { Composer } from "grammy";
import { optInUser } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { extractUserDetails } from "#root/bot/helpers/user.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const OPT_IN_STATUS_MESSAGES = {
    newUser: "opt-in-new-user",
    restored: "opt-in-restored",
    alreadyOptedIn: "opt-in-already-enabled",
} as const;

feature.command("optin", logHandle("command-optin"), async (ctx) => {
    const userDetails = extractUserDetails(ctx.from);
    const optInStatus = await optInUser(userDetails);

    return ctx.reply(ctx.t(OPT_IN_STATUS_MESSAGES[optInStatus]));
});

export { composer as optinFeature };
