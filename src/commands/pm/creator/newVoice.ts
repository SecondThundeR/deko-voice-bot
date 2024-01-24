import { Composer } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const newVoiceCommand = new Composer<BotContext>();

newVoiceCommand.command(
    "newvoice",
    async (ctx) => await ctx.conversation.enter("new-voice"),
);
