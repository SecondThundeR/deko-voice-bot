import { Composer } from "grammy";

import { sendInlineRequestKeyboard } from "@/src/constants/keyboards";

import type { BotContext } from "@/src/types/bot";

const STICKER_FOR_DEEPLINK = process.env.STICKER_FILE_ID_FOR_DEEPLINK;

export const startCommand = new Composer<BotContext>();

startCommand.command("start", async (ctx) => {
    if (ctx.match === "_" && STICKER_FOR_DEEPLINK) {
        return await ctx.replyWithSticker(STICKER_FOR_DEEPLINK);
    }

    await ctx.reply(ctx.t("start"), {
        reply_markup: sendInlineRequestKeyboard,
    });
});
