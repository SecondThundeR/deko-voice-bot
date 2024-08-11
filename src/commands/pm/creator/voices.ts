import { Composer } from "grammy";

import { prepareVoicesSessionMenu } from "@/src/helpers/menu";

import { voicesMenu } from "@/src/menu/voices";

import type { BotContext } from "@/src/types/bot";

export const voicesCommand = new Composer<BotContext>();

voicesCommand.command("voices", async (ctx) => {
    const prepareStatus = await prepareVoicesSessionMenu(ctx);
    if (!prepareStatus) return await ctx.reply(ctx.t("voices.noData"));

    await ctx.reply(ctx.t("voices.menuHeader"), { reply_markup: voicesMenu });
});
