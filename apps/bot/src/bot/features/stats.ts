import { getBasicStats } from "@deko-voice-bot/database/queries/stats.js";
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("stats", logHandle("command-stats"), async (ctx) => {
    const statsData = await getBasicStats();

    return ctx.reply(ctx.t("stats-message", statsData));
});

export { composer as statsFeature };
