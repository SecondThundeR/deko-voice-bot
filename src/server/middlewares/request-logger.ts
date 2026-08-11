import type { MiddlewareHandler } from "hono";
import { getPath } from "hono/utils/url";

const KNOWN_PATHS = new Set(["/", "/webhook"]);

function getSafePath(request: Request) {
    const path = getPath(request);

    return KNOWN_PATHS.has(path) ? path : "[other]";
}

export function requestLogger(): MiddlewareHandler {
    return async (c, next) => {
        const { method } = c.req;
        const path = getSafePath(c.req.raw);

        c.var.logger.debug({
            msg: "Incoming request",
            method,
            path,
        });
        const startTime = performance.now();

        await next();

        const endTime = performance.now();
        c.var.logger.debug({
            msg: "Request completed",
            method,
            path,
            status: c.res.status,
            durationMs: endTime - startTime,
        });
    };
}
