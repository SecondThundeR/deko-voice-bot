import { createMiddleware } from "hono/factory";
import type { ApiDependencies } from "./dependencies.ts";
import { HttpError } from "./errors.ts";
import type { RateLimitPolicy } from "./rate-limit.ts";
import type { ApiEnv } from "./types.ts";

const DEFAULT: RateLimitPolicy = { limit: 120, windowMs: 60_000 };
const STRICT: RateLimitPolicy = { limit: 10, windowMs: 60_000 };
function policy(c: { req: { path: string; method: string } }) {
    return c.req.path.includes("/uploads") ||
        (c.req.path.includes("/admin") &&
            !["GET", "HEAD", "OPTIONS"].includes(c.req.method))
        ? STRICT
        : DEFAULT;
}

function isStrictPolicy(value: RateLimitPolicy) {
    return value === STRICT;
}
export const secureHeaders = createMiddleware<ApiEnv>(async (c, next) => {
    await next();
    c.header("x-content-type-options", "nosniff");
    c.header("x-frame-options", "DENY");
    c.header("referrer-policy", "no-referrer");
    c.header("cross-origin-resource-policy", "same-origin");
});
export function cors(origins: readonly string[]) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const origin = c.req.header("origin");
        if (origin) {
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
