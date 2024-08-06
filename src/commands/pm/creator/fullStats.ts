import { Composer } from "grammy";

import { getFullStatsMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

export const fullStatsCommand = new Composer<BotContext>();

fullStatsCommand.command("fullstats", async (ctx) => {
    const statsMessageText = await getFullStatsMessageText(ctx);

    await ctx.reply(statsMessageText, {
        parse_mode: "HTML",
    });
});
