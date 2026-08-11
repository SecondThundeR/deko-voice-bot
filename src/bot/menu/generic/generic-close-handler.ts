import type { CallbackWithContext, Context } from "#root/bot/context.js";
import { closeMenuExceptionHandler } from "#root/bot/helpers/menu.js";
import { getSafeErrorInfo } from "#root/logging.js";

export async function genericCloseHandler(
    ctx: Context,
    onClose?: CallbackWithContext,
) {
    try {
        await ctx.deleteMessage().catch(() => {});
        onClose?.(ctx);
    } catch (error: unknown) {
        ctx.logger.error({
            msg: "Failed to close menu",
            ...getSafeErrorInfo(error),
        });
        return closeMenuExceptionHandler(ctx);
    } finally {
        await ctx.callbackQuery?.answer();
    }
}
