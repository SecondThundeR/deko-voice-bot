import { performance } from "node:perf_hooks";
import type { Middleware } from "grammy";

import type { Context } from "#root/bot/context.js";

export function getUpdateType(ctx: Context) {
    return (
        Object.keys(ctx.update).find((key) => key !== "update_id") ?? "unknown"
    );
}

export function logHandle(id: string): Middleware<Context> {
    return async (ctx, next) => {
        ctx.logger.debug({
            msg: "Handler started",
            handler: id,
        });

        const startedAt = performance.now();
        await next();

        ctx.logger.debug({
            msg: "Handler completed",
            handler: id,
            durationMs: performance.now() - startedAt,
        });
    };
}
