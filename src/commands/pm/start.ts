import { Composer } from "grammy";

import {
    donateInlineKeyboard,
    sendInlineRequestKeyboard,
} from "@/src/constants/keyboards";

import type { BotContext } from "@/src/types/bot";

export const startCommand = new Composer<BotContext>();

startCommand.command("start", async (ctx) => {
    if (ctx.match === "donate") {
        return await ctx.reply(ctx.t("donate.commandText"), {
            reply_markup: donateInlineKeyboard,
        });
    }

    await ctx.reply(ctx.t("start"), {
        reply_markup: sendInlineRequestKeyboard,
    });
});
