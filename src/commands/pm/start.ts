import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import type { BotContext } from "@/src/types/bot";

export const startCommand = new Composer<BotContext>();

startCommand.command("start", async (ctx) => {
    const { stickerFileID } = ctx.config;

    if (ctx.match === "_" && stickerFileID) {
        return await ctx.replyWithSticker(stickerFileID);
    }

    await ctx.reply(ctx.t("start"), {
        reply_markup: sendInlineRequestKeyboard,
    });
});
