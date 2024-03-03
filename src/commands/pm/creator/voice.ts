import { Composer } from "@/deps.ts";

import { sendCurrentInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

import type { BotContext } from "@/src/types/bot.ts";
import { checkQueriesCache } from "@/src/helpers/cache.ts";

export const voiceCommand = new Composer<BotContext>();

voiceCommand.command("voice", async (ctx) => {
    const queries = checkQueriesCache();
    if (!queries || queries.length === 0) {
        return await ctx.reply(ctx.t("voices.noData"));
    }

    await ctx.reply(ctx.t("voices.menuItemHeaderHint"), {
        reply_markup: sendCurrentInlineRequestKeyboard,
    });
});
