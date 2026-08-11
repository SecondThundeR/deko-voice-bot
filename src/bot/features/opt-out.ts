import { Composer } from "grammy";
import { optOutUser } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getLocalizedUserData } from "#root/bot/helpers/user.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optout", logHandle("command-optout"), async (ctx) => {
    const userId = ctx.from.id;
    const lastUserData = await optOutUser(userId);
    if (!lastUserData) {
        return ctx.reply(ctx.t("opt-out-failed"));
    }

    const locale = await ctx.i18n.getLocale();
    const localizedUserData = getLocalizedUserData(ctx.t, locale, lastUserData);

    return ctx.reply(
        [
            ctx.t("opt-out-success-header"),
            localizedUserData,
            "",
            ctx.t("opt-out-success-footer"),
        ].join("\n"),
    );
});

export { composer as optoutFeature };
