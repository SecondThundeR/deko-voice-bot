import { Composer } from "grammy";
import { getUsersBasicStatsQuery } from "@/drizzle/prepared/users";
import { getVoicesBasicStatsQuery } from "@/drizzle/prepared/voices";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";
import { getBasicStatsData } from "../helpers/stats";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("stats", logHandle("command-stats"), async (ctx) => {
    const [usersData, voicesData] = await Promise.all([
        getUsersBasicStatsQuery.execute(),
        getVoicesBasicStatsQuery.execute(),
    ]);
    const statsMessageData = getBasicStatsData(usersData, voicesData);

    await ctx.reply(ctx.t("stats.regular", statsMessageData));
});

export { composer as statsFeature };
