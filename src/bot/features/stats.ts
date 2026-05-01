import { Composer } from "grammy";
import { getBasicStatsQuery } from "@/drizzle/prepared/stats";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("stats", logHandle("command-stats"), async (ctx) => {
    const [statsData] = await getBasicStatsQuery.execute();

    return ctx.reply(ctx.t("stats.regular", statsData));
});

export { composer as statsFeature };
