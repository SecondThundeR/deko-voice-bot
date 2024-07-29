import { Composer } from "grammy";

import { getStatsMessageText } from "@/src/helpers/locale";

import type { BotContext } from "@/src/types/bot";

export const statsCommand = new Composer<BotContext>();

statsCommand.command("stats", async (ctx) => {
    const statsMessageText = await getStatsMessageText(ctx);

    await ctx.reply(statsMessageText, {
        parse_mode: "HTML",
    });
});
