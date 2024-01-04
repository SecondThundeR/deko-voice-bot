import { closeMenuExceptionHandler } from "@/src/helpers/menu.ts";

import type { BotContext } from "@/src/types/bot.ts";

export async function closeMenuHandler(ctx: BotContext) {
    try {
        await ctx.deleteMessage();
        ctx.session.currentFavorites = null;
        ctx.session.currentOffset = 0;
    } catch (error: unknown) {
        console.error(
            "Something prevented from closing menu:",
            (error as Error).message,
        );

        await closeMenuExceptionHandler(ctx);
    } finally {
        await ctx.answerCallbackQuery();
    }
}
