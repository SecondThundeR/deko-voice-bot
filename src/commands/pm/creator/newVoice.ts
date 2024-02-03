import { Composer } from "@/deps.ts";

import { canRunFFMPEG } from "@/src/helpers/general.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const newVoiceCommand = new Composer<BotContext>();

newVoiceCommand.command(
    "newvoice",
    async (ctx) => {
        const hasFFMPEG = await canRunFFMPEG();
        if (!hasFFMPEG) return await ctx.reply(ctx.t("newvoice.noFFMPEG"));
        await ctx.conversation.enter("new-voice");
    },
);
