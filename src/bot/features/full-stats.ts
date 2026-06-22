import { Composer } from "grammy";
import { getFullStatsQuery } from "#drizzle/prepared/stats.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getFullStatsData } from "#root/bot/helpers/stats.js";

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
