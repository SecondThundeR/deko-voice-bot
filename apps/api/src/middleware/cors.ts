import { createMiddleware } from "hono/factory";
import { HttpError } from "../http/errors.ts";
import type { ApiEnv } from "../types.ts";

export function cors(origins: readonly string[]) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const origin = c.req.header("origin");
        if (origin && origins.length > 0) {
            if (!origins.includes(origin))
                throw new HttpError(
                    403,
                    "CORS_DENIED",
                    "Недопустимый источник запроса",
                );
            c.header("access-control-allow-origin", origin);
            c.header("vary", "Origin");
            c.header(
                "access-control-allow-methods",
                "GET, POST, PATCH, DELETE, OPTIONS",
            );
            c.header(
                "access-control-allow-headers",
                "Authorization, Content-Type, X-Request-ID",
            );
            c.header("access-control-max-age", "600");
        }
        if (c.req.method === "OPTIONS") return c.body(null, 204);
        await next();
    });
}
