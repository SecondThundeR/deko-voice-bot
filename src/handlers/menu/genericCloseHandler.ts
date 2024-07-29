import { closeMenuExceptionHandler } from "@/src/helpers/menu";

import type { BotContext } from "@/src/types/bot";

export async function genericCloseHandler(
    ctx: BotContext,
    onClose?: (ctx: BotContext) => void,
) {
    try {
        await ctx.deleteMessage();

        onClose?.(ctx);
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
