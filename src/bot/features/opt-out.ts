import { Composer } from "grammy";
import { optOutUser } from "#drizzle/queries/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getLocalizedUserData } from "#root/bot/helpers/user.js";
import { clearBotUserSessionState } from "#root/bot/session/state.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("optout", logHandle("command-optout"), async (ctx) => {
    const userId = ctx.from.id;
    const result = await optOutUser(userId);
    if (result.status === "alreadyDisabled") {
        return ctx.reply(ctx.t("opt-out-failed"));
    }

    await clearBotUserSessionState(userId);

    const previousData = result.previousData;
    const previousDataText = previousData
        ? getLocalizedUserData(ctx.t, await ctx.i18n.getLocale(), previousData)
        : ctx.t("opt-out-no-previous-statistics");

    return ctx.reply(
        [
            ctx.t("opt-out-success-header"),
            previousDataText,
            ctx.t("my-data-favorites-count", {
                favoritesCount: previousData?.favoritesCount ?? 0,
            }),
            "",
            ctx.t("opt-out-success-footer"),
        ].join("\n"),
    );
});

export { composer as optoutFeature };
