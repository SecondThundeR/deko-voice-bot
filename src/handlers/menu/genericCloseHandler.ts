import { closeMenuExceptionHandler } from "@/src/helpers/menu";

import type { BotContext, CallbackWithContext } from "@/src/types/bot";

export async function genericCloseHandler(
    ctx: BotContext,
    onClose?: CallbackWithContext,
) {
    try {
        await ctx.deleteMessage();
        onClose?.(ctx);
    } catch (error: unknown) {
        let errorMessage = "Something prevented from closing menu. Details: ";

        if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += JSON.stringify(error, null, 4);
        }

        console.error(errorMessage);
        await closeMenuExceptionHandler(ctx);
    } finally {
        await ctx.answerCallbackQuery();
    }
}
