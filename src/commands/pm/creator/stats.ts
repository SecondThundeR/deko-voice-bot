import { Composer } from "grammy";

import { getVoicesBasicStatsQuery } from "@/drizzle/prepared/voices";
import { getUsersBasicStatsQuery } from "@/drizzle/prepared/users";

import { getBasicStatsData } from "@/src/helpers/stats";

import type { BotContext } from "@/src/types/bot";

export const statsCommand = new Composer<BotContext>();

statsCommand.command("stats", async (ctx) => {
    const [usersData, voicesData] = await Promise.all([
        getUsersBasicStatsQuery.execute(),
        getVoicesBasicStatsQuery.execute(),
    ]);
    const statsMessageData = getBasicStatsData(usersData, voicesData);

    await ctx.reply(ctx.t("stats.regular", statsMessageData), {
        parse_mode: "HTML",
    });
});
