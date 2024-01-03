import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

import type { BotContext } from "@/src/types/bot.ts";

const STICKER_FOR_DEEPLINK = Deno.env.get("STICKER_FILE_ID_FOR_DEEPLINK");

export const startCommand = new Composer<BotContext>();

startCommand.command("start", async (ctx) => {
    if (ctx.match === featureFlags.maintenance) {
        return await ctx.reply(ctx.t("maintenance.description-inline"));
    }

    if (ctx.match === "_" && STICKER_FOR_DEEPLINK) {
        return await ctx.replyWithSticker(STICKER_FOR_DEEPLINK);
    }

    await ctx.reply(ctx.t("start"), {
        reply_markup: sendInlineRequestKeyboard,
    });
});
