import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export function bearerAuth(expectedToken: string): MiddlewareHandler {
    const expected = Buffer.from(`Bearer ${expectedToken}`);

    return async (c, next) => {
        const actual = Buffer.from(c.req.header("authorization") ?? "");
        if (
            actual.length !== expected.length ||
            !timingSafeEqual(actual, expected)
        ) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        await next();
    };
}
