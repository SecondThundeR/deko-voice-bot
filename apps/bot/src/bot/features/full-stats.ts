import { getFullStats } from "@deko-voice-bot/database/queries/stats.js";
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getFullStatsData } from "#root/bot/helpers/stats.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("fullstats", logHandle("command-fullstats"), async (ctx) => {
    const statsData = await getFullStats();
    const locale = await ctx.i18n.getLocale();
    const statsMessageData = getFullStatsData(statsData, ctx.t, locale);

    return ctx.reply(ctx.t("full-stats-message", statsMessageData));
});

export { composer as fullStatsFeature };
