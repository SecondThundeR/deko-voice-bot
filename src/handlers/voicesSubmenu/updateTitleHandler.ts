import { genericCloseHandler } from "@/src/handlers/menu/genericCloseHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function updateTitleHandler(ctx: MenuBotContext) {
    await genericCloseHandler(ctx);
    await ctx.conversation.enter("voice-title-update");
}
