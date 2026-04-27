import { Composer } from "grammy";
import { getFullStatsQuery } from "@/drizzle/prepared/stats";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";
import { getFullStatsData } from "../helpers/stats";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("fullstats", logHandle("command-fullstats"), async (ctx) => {
    const [statsData] = await getFullStatsQuery.execute();
    const statsMessageData = getFullStatsData({
        basicStats: {
            allUsedUsers: statsData.allUsedUsers,
            allIgnoredUsers: statsData.allIgnoredUsers,
            allMAUUsers: statsData.allMAUUsers,
            allInactiveUsers: statsData.allInactiveUsers,
            allUsedVoices: statsData.allUsedVoices,
        },
        mostUsedUsersStats: statsData.mostUsedUsersStats,
        lastUsedUsersStats: statsData.lastUsedUsersStats,
        mostUsedVoicesStats: statsData.mostUsedVoicesStats,
    });

    await ctx.reply(ctx.t("stats.full", statsMessageData));
});

export { composer as fullStatsFeature };
