import { createMiddleware } from "hono/factory";
import type { ApiDependencies } from "../dependencies/types.ts";
import { HttpError } from "../http/errors.ts";
import type { RateLimitPolicy } from "../rate-limit.ts";
import type { ApiEnv } from "../types.ts";

const DEFAULT: RateLimitPolicy = { limit: 120, windowMs: 60_000 };
const STRICT: RateLimitPolicy = { limit: 10, windowMs: 60_000 };

function policy(c: { req: { path: string; method: string } }) {
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(c.req.method);
    return isMutation &&
        (c.req.path.endsWith("/submissions") || c.req.path.includes("/admin"))
        ? STRICT
        : DEFAULT;
}

function isStrictPolicy(value: RateLimitPolicy) {
    return value === STRICT;
}

export function ipRateLimit(deps: ApiDependencies) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        if (c.req.path === "/health" || c.req.path === "/ready") return next();
        // Node's incoming socket address is server-provided. Do not trust client-set
        // forwarding headers unless a separately configured trusted-proxy middleware does so.
        const incoming = (c.env ?? {}) as {
            incoming?: { socket?: { remoteAddress?: string } };
        };
        const ip = incoming.incoming?.socket?.remoteAddress ?? "unknown";
        const selectedPolicy = policy(c);
        const result = await deps.rateLimiter.consume(
            `api:ip:${ip}`,
            selectedPolicy,
        );
        deps.metrics?.rateLimit({
            scope: "ip",
            allowed: result.allowed,
            strict: isStrictPolicy(selectedPolicy),
        });
        if (!result.allowed) {
            c.header("retry-after", String(result.retryAfterSeconds));
            throw new HttpError(429, "RATE_LIMITED", "Слишком много запросов");
        }
        await next();
    });
}

export function userRateLimit(deps: ApiDependencies) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const selectedPolicy = policy(c);
        const result = await deps.rateLimiter.consume(
            `api:user:${c.var.user.id}`,
            selectedPolicy,
        );
        deps.metrics?.rateLimit({
            scope: "user",
            allowed: result.allowed,
            strict: isStrictPolicy(selectedPolicy),
        });
        if (!result.allowed) {
            c.header("retry-after", String(result.retryAfterSeconds));
            throw new HttpError(429, "RATE_LIMITED", "Слишком много запросов");
        }
        await next();
    });
}
