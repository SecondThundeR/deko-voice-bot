import { Composer } from "grammy";

import { donateInlineKeyboard } from "@/src/constants/keyboards";

import type { BotContext } from "@/src/types/bot";

export const donateCommand = new Composer<BotContext>();

donateCommand.command("donate", async (ctx) => {
    await ctx.reply(ctx.t("donate.commandText"), {
        reply_markup: donateInlineKeyboard,
    });
});
