import { Composer } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const newRemoteVoiceCommand = new Composer<BotContext>();

newRemoteVoiceCommand.command(
    "newremotevoice",
    async (ctx) => await ctx.conversation.enter("new-remote-voice"),
);
