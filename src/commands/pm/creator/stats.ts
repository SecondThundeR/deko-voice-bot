import { Composer } from "@/deps.ts";

import { getStatsMessageText } from "@/src/helpers/locale.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const statsCommand = new Composer<BotContext>();

statsCommand.command("stats", async (ctx) => {
    const statsMessageText = await getStatsMessageText(ctx);

    await ctx.reply(statsMessageText, {
        parse_mode: "HTML",
    });
});
