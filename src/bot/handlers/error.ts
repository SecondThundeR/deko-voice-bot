import type { ErrorHandler } from "grammy";

import type { Context } from "#root/bot/context.js";
import { getSafeErrorInfo } from "#root/logging.js";

export const errorHandler: ErrorHandler<Context> = (error) => {
    const { ctx } = error;

    ctx.logger.error({
        msg: "Update processing failed",
        ...getSafeErrorInfo(error.error),
    });
    // Propagate the failure so webhook mode responds with a non-success status
    // and Telegram can retry the update.
    throw error.error;
};
