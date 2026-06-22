import { Composer } from "grammy";
import { optOutUser } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getFormattedUserData } from "#root/bot/helpers/user.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optout", logHandle("command-optout"), async (ctx) => {
    const userId = ctx.from.id;
    const lastUserData = await optOutUser(userId);
    if (!lastUserData) {
        return ctx.reply(ctx.t("optout.failed"));
    }

    return ctx.reply(
        ctx.t("optout.success", getFormattedUserData(lastUserData)),
    );
});

export { composer as optoutFeature };
