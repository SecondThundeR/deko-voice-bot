import { closeMenuExceptionHandler } from "@/src/helpers/menu.ts";

import type { BotContext } from "@/src/types/bot.ts";

type OnCloseCallback = (ctx: BotContext) => void;

export async function genericCloseHandler(
    ctx: BotContext,
    onClose: OnCloseCallback,
) {
    try {
        await ctx.deleteMessage();
        onClose(ctx);
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
