import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../types.ts";

export const secureHeaders = createMiddleware<ApiEnv>(async (c, next) => {
    await next();
    c.header("x-content-type-options", "nosniff");
    c.header("x-frame-options", "DENY");
    c.header("referrer-policy", "no-referrer");
    c.header("cross-origin-resource-policy", "same-origin");
});
