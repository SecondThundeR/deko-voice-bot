import { Composer } from "grammy";

import type { BotContext } from "@/src/types/bot";

export const newVoicesCommand = new Composer<BotContext>();

newVoicesCommand.command("newvoices", async (ctx) => {
    if (!ctx.session.canRunFFMPEG)
        return await ctx.reply(ctx.t("newvoices.noFFMPEG"));

    await ctx.conversation.enter("new-voices");
});
