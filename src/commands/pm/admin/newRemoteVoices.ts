import { Composer } from "grammy";

import type { BotContext } from "@/src/types/bot";

export const newRemoteVoicesCommand = new Composer<BotContext>();

newRemoteVoicesCommand.command(
    "newremotevoices",
    async (ctx) => await ctx.conversation.enter("new-remote-voices"),
);
