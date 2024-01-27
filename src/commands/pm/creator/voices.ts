import { Composer } from "@/deps.ts";

import { prepareVoicesSessionMenu } from "@/src/helpers/menu.ts";

import { voicesMenu } from "@/src/menu/voices.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const voicesCommand = new Composer<BotContext>();

voicesCommand.command("voices", async (ctx) => {
    await prepareVoicesSessionMenu(ctx);
    await ctx.reply(ctx.t("voices.menuHeader"), { reply_markup: voicesMenu });
});
