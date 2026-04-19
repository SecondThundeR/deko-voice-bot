import { Composer } from "grammy";
import { getUsersFullStatsQuery } from "@/drizzle/prepared/users";
import { getVoicesFullStatsQuery } from "@/drizzle/prepared/voices";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";
import { getFullStatsData } from "../helpers/stats";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("fullstats", logHandle("command-fullstats"), async (ctx) => {
    const [usersData, voicesData] = await Promise.all([
        getUsersFullStatsQuery.execute(),
        getVoicesFullStatsQuery.execute(),
    ]);
    const statsMessageData = getFullStatsData(usersData, voicesData);

    await ctx.reply(ctx.t("stats.full", statsMessageData));
});

export { composer as fullStatsFeature };
