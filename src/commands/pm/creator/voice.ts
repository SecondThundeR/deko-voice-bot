import { Composer } from "@/deps.ts";

import { sendCurrentInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const voiceCommand = new Composer<BotContext>();

voiceCommand.command("voice", async (ctx) => {
    await ctx.reply(ctx.t("voices.menuItemHeaderHint"), {
        reply_markup: sendCurrentInlineRequestKeyboard,
    });
});
