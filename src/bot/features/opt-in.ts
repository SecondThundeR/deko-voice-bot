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

    switch (optInStatus) {
        case "newUser":
            return ctx.reply(ctx.t("optin.newUser"));
        case "restored":
            return ctx.reply(ctx.t("optin.success"));
        case "alreadyOptedIn":
            return ctx.reply(ctx.t("optin.alreadyOptedIn"));
    }
});

export { composer as optinFeature };
