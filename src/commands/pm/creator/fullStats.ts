import { Composer } from "grammy";

import { getVoicesFullStatsQuery } from "@/drizzle/prepared/voices";
import { usersFullStatsQuery } from "@/drizzle/prepared/users";

import { getFullStatsData } from "@/src/helpers/stats";

import type { BotContext } from "@/src/types/bot";

export const fullStatsCommand = new Composer<BotContext>();

fullStatsCommand.command("fullstats", async (ctx) => {
    const usersData = await usersFullStatsQuery.execute();
    const voicesData = await getVoicesFullStatsQuery.execute();
    const statsMessageData = getFullStatsData(usersData, voicesData);

    await ctx.reply(ctx.t("stats.full", statsMessageData), {
        parse_mode: "HTML",
    });
});
