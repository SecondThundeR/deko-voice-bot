import type { CallbackWithContext, Context } from "../../context";
import { getUpdateInfo } from "../../helpers/logging";
import { closeMenuExceptionHandler } from "../../helpers/menu";

export async function genericCloseHandler(
    ctx: Context,
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

        ctx.logger.error({
            err: errorMessage,
            update: getUpdateInfo(ctx),
        });
        return closeMenuExceptionHandler(ctx);
    } finally {
        await ctx.callbackQuery?.answer();
    }
}
