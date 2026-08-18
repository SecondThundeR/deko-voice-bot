import { createMiddleware } from "hono/factory";
import type { ApiDependencies } from "../dependencies/types.ts";
import type { ApiEnv } from "../types.ts";

export function requestLogging(deps: ApiDependencies) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const started = Date.now();
        await next();
        const latencyMs = Date.now() - started;
        deps.metrics?.request({
            method: c.req.method,
            route: c.req.routePath,
            status: c.res.status,
            durationMs: latencyMs,
        });
        deps.logger.info?.(
            {
                method: c.req.method,
                route: c.req.routePath || c.req.path,
                status: c.res.status,
                requestId: c.var.requestId,
                latencyMs,
            },
            "API request",
        );
    });
}
