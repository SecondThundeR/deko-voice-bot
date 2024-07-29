import { Composer } from "grammy";

import { canRunFFMPEG } from "@/src/helpers/general";

import type { BotContext } from "@/src/types/bot";

export const newVoicesCommand = new Composer<BotContext>();

newVoicesCommand.command("newvoices", async (ctx) => {
    const hasFFMPEG = await canRunFFMPEG();
    if (!hasFFMPEG) return await ctx.reply(ctx.t("newvoices.noFFMPEG"));

    await ctx.conversation.enter("new-voices");
});
