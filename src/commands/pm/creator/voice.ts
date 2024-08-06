import { Composer } from "grammy";

import { sendCurrentInlineRequestKeyboard } from "@/src/constants/keyboards";

import { getCurrentVoiceQueriesData } from "@/src/helpers/voices";

import type { BotContext } from "@/src/types/bot";

export const voiceCommand = new Composer<BotContext>();

voiceCommand.command("voice", async (ctx) => {
    const voicesData = await getCurrentVoiceQueriesData();
    if (!voicesData || voicesData.length === 0) {
        return await ctx.reply(ctx.t("voices.noData"));
    }

    await ctx.reply(ctx.t("voices.menuItemHeaderHint"), {
        reply_markup: sendCurrentInlineRequestKeyboard,
    });
});
