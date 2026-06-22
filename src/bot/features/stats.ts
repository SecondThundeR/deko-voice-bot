import { Composer } from "grammy";
import { getBasicStatsQuery } from "#drizzle/prepared/stats.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("stats", logHandle("command-stats"), async (ctx) => {
    const [statsData] = await getBasicStatsQuery.execute();

    return ctx.reply(ctx.t("stats.regular", statsData));
});

export { composer as statsFeature };
