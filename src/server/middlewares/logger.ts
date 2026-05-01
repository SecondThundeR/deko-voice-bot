import type { MiddlewareHandler } from "hono";

import type { Logger } from "../../logger";

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
