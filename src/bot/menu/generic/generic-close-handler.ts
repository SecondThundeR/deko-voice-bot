import type { CallbackWithContext, Context } from "#root/bot/context.js";
import { getUpdateInfo } from "#root/bot/helpers/logging.js";
import { closeMenuExceptionHandler } from "#root/bot/helpers/menu.js";

export async function genericCloseHandler(
    ctx: Context,
    onClose?: CallbackWithContext,
) {
    try {
        await ctx.deleteMessage().catch(() => {});
        onClose?.(ctx);
    } catch (error: unknown) {
        let errorMessage = "Something prevented from closing menu. Details: ";

        if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += JSON.stringify(error, null, 4);
        }

        ctx.logger.error({
            err: errorMessage,
            update: getUpdateInfo(ctx),
        });
        return closeMenuExceptionHandler(ctx);
    } finally {
        await ctx.callbackQuery?.answer();
    }
}
