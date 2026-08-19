import { Composer } from "grammy";
import { getUserData } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getLocalizedUserData } from "#root/bot/helpers/user.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("mydata", logHandle("command-mydata"), async (ctx) => {
    const userData = await getUserData(ctx.from.id);
    if (!userData) {
        return ctx.reply(ctx.t("my-data-not-found"));
    }

    const locale = await ctx.i18n.getLocale();
    const localizedUserData = getLocalizedUserData(ctx.t, locale, userData);

    return ctx.reply(
        [
            ctx.t("my-data-header"),
            localizedUserData,
            "",
            ctx.t("my-data-footer"),
        ].join("\n"),
    );
});

export { composer as mydataFeature };
