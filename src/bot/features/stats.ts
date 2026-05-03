import { getBasicStatsQuery } from "drizzle/prepared/stats";
import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { logHandle } from "@/bot/helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("stats", logHandle("command-stats"), async (ctx) => {
    const [statsData] = await getBasicStatsQuery.execute();

    return ctx.reply(ctx.t("stats.regular", statsData));
});

export { composer as statsFeature };
