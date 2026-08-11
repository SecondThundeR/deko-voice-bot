import { performance } from "node:perf_hooks";
import type { Middleware } from "grammy";

import type { Context } from "#root/bot/context.js";

export function updateLogger(): Middleware<Context> {
    return async (ctx, next) => {
        ctx.api.config.use((previous, method, payload, signal) => {
            ctx.logger.debug({
                msg: "Bot API call",
                method,
                payloadFields: Object.keys(payload).sort(),
            });

            return previous(method, payload, signal);
        });

        ctx.logger.debug({
            msg: "Update received",
        });

        const startTime = performance.now();
        try {
            await next();
        } finally {
            const endTime = performance.now();
            ctx.logger.debug({
                msg: "Update processed",
                durationMs: endTime - startTime,
            });
        }
    };
}
