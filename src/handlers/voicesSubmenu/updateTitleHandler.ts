import { genericCloseHandler } from "@/src/handlers/menu/genericCloseHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function updateTitleHandler(ctx: MenuBotContext) {
    await genericCloseHandler(ctx);
    await ctx.conversation.enter("voice-title-update");
}
