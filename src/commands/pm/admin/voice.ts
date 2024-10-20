import { Composer } from "grammy";

import { getVoicesCount } from "@/drizzle/queries/select";

import { sendCurrentInlineRequestKeyboard } from "@/src/constants/keyboards";

import type { BotContext } from "@/src/types/bot";

export const voiceCommand = new Composer<BotContext>();

voiceCommand.command("voice", async (ctx) => {
    const voicesCount = await getVoicesCount();
    if (voicesCount === 0) {
        return await ctx.reply(ctx.t("voices.noData"));
    }

    await ctx.reply(ctx.t("voices.menuItemHeaderHint"), {
        reply_markup: sendCurrentInlineRequestKeyboard,
    });
});
