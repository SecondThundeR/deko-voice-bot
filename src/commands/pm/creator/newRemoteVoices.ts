import { Composer } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const newRemoteVoicesCommand = new Composer<BotContext>();

newRemoteVoicesCommand.command(
    "newremotevoices",
    async (ctx) => await ctx.conversation.enter("new-remote-voices"),
);
