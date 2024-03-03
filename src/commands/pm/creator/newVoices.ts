import { Composer } from "@/deps.ts";

import { canRunFFMPEG } from "@/src/helpers/general.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const newVoicesCommand = new Composer<BotContext>();

newVoicesCommand.command(
    "newvoices",
    async (ctx) => {
        const hasFFMPEG = await canRunFFMPEG();
        if (!hasFFMPEG) return await ctx.reply(ctx.t("newvoices.noFFMPEG"));
        await ctx.conversation.enter("new-voices");
    },
);
