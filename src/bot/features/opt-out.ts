import { optOutUser } from "drizzle/queries/users";
import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { logHandle } from "@/bot/helpers/logging";
import { getFormattedUserData } from "@/bot/helpers/user";

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
