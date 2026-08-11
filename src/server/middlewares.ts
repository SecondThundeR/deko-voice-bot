import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { getPath } from "hono/utils/url";

import type { Logger } from "#root/logger.js";

const KNOWN_PATHS = new Set(["/", "/webhook"]);

export function requestId(): MiddlewareHandler {
    return (c, next) => {
        c.set("requestId", randomUUID());
        return next();
    };
}

export function setLogger(logger: Logger): MiddlewareHandler {
    return (c, next) => {
        c.set(
            "logger",
            logger.child({
                requestId: c.get("requestId"),
            }),
        );
        return next();
    };
}

export function requestLogger(): MiddlewareHandler {
    return async (c, next) => {
        const { method } = c.req;
        const requestPath = getPath(c.req.raw);
        const path = KNOWN_PATHS.has(requestPath) ? requestPath : "[other]";

        c.var.logger.debug({
            msg: "Incoming request",
            method,
            path,
        });
        const startTime = performance.now();

        await next();

        c.var.logger.debug({
            msg: "Request completed",
            method,
            path,
            status: c.res.status,
            durationMs: performance.now() - startTime,
        });
    };
}
