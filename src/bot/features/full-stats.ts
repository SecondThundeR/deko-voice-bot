import { getFullStatsQuery } from "drizzle/prepared/stats";
import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { logHandle } from "@/bot/helpers/logging";
import { getFullStatsData } from "@/bot/helpers/stats";

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

    return ctx.reply(ctx.t("stats.full", statsMessageData));
});

export { composer as fullStatsFeature };
