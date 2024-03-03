import { Composer } from "@/deps.ts";

import { getFullStatsMessageText } from "@/src/helpers/locale.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const fullStatsCommand = new Composer<BotContext>();

fullStatsCommand.command("fullstats", async (ctx) => {
    const statsMessageText = await getFullStatsMessageText(ctx);

    await ctx.reply(statsMessageText, {
        parse_mode: "HTML",
    });
});
