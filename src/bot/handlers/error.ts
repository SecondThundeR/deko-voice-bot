import type { ErrorHandler } from "grammy";

import type { Context } from "#root/bot/context.js";
import { getSafeErrorInfo } from "#root/logging.js";

export const errorHandler: ErrorHandler<Context> = (error) => {
    const { ctx } = error;

    ctx.logger.error({
        msg: "Update processing failed",
        ...getSafeErrorInfo(error.error),
    });
};
